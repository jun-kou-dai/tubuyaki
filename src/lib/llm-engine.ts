/**
 * LLM変換エンジン
 * つぶやき（生テキスト）→ 構造化データに変換する処理パイプライン
 *
 * 処理順序:
 * 1. 意図推定 (intent)
 * 2. エンティティ抽出 (entities)
 * 3. 3行要約 (summary_3lines)
 * 4. アイデア生成 (ideas, max 3)
 * 5. 次の一手 (next_action)
 * 6. 自信度評価 (confidence)
 */

export interface TransformResult {
  cleanText: string;
  intent: string[];
  entities: {
    people: string[];
    places: string[];
    deadlines: string[];
    amounts: string[];
    tools: string[];
    organizations: string[];
  };
  summary3lines: string;
  ideas: string[];
  nextAction: string;
  confidence: number;
  context: string;
  confirmQuestion?: string;
}

const SYSTEM_PROMPT = `あなたは「つぶやき変換エンジン」です。
ユーザーが散歩中・運転中・日常の中で音声入力した生テキストを、構造化データに変換します。

## 処理ルール

1. **clean_text**: 生テキストからフィラー（えーと、あの、まあ）・言い直し・不要な繰り返しを除去し、読みやすく整形する。意味は絶対に変えない。
2. **intent**: 意図タグを1つ以上付与する。選択肢: Problem, Desire, Insight, Decision, Note
   - 愚痴でも必ず Problem を付与
   - 複数該当する場合はすべて付与
3. **entities**: 固有名詞・数値を抽出
   - people: 人名
   - places: 場所
   - deadlines: 期限・日時
   - amounts: 金額・数量
   - tools: 道具・ツール・アプリ
   - organizations: 組織・会社
4. **summary_3lines**: 必ず3行で要約。各行の役割:
   - 1行目: 何が起きた（事実）
   - 2行目: 何を感じた（感情・評価）
   - 3行目: 何が論点（課題・問い）
5. **ideas**: アイデアを最大3案生成
   - 1案目: 現実的（すぐ試せる具体的アクション）
   - 2案目: プロダクト化（アプリ・仕組みとしての可能性）
   - 3案目: ユーザー最適化（iPad中心・1画面で完結・継続トリガーを意識）
   - 内容が薄い場合は1〜2案でも可
6. **next_action**: 次の一手を必ず1つ。行動 or 次に答えるべき質問
7. **confidence**: 0〜1の自信度。0.5未満の場合は confirm_question に確認質問を入れる
8. **context**: 状況推定（walk / drive / unknown）テキスト内容から推定

## 出力フォーマット
必ず以下のJSON形式で返してください。JSONのみ、説明文は不要です。

{
  "clean_text": "...",
  "intent": ["Problem"],
  "entities": {
    "people": [],
    "places": [],
    "deadlines": [],
    "amounts": [],
    "tools": [],
    "organizations": []
  },
  "summary_3lines": "1行目\\n2行目\\n3行目",
  "ideas": ["1案目", "2案目", "3案目"],
  "next_action": "...",
  "confidence": 0.8,
  "context": "unknown",
  "confirm_question": null
}`;

export async function transformTubuyaki(
  rawText: string,
  apiKey: string
): Promise<TransformResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${SYSTEM_PROMPT}\n\n---\n\nユーザーの入力:\n${rawText}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("Gemini returned empty response");
  }

  const parsed = JSON.parse(content);

  return {
    cleanText: parsed.clean_text || rawText,
    intent: parsed.intent || ["Note"],
    entities: {
      people: parsed.entities?.people || [],
      places: parsed.entities?.places || [],
      deadlines: parsed.entities?.deadlines || [],
      amounts: parsed.entities?.amounts || [],
      tools: parsed.entities?.tools || [],
      organizations: parsed.entities?.organizations || [],
    },
    summary3lines: parsed.summary_3lines || "",
    ideas: parsed.ideas || [],
    nextAction: parsed.next_action || "",
    confidence: parsed.confidence ?? 0.5,
    context: parsed.context || "unknown",
    confirmQuestion: parsed.confirm_question || undefined,
  };
}
