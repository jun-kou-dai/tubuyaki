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

const SYSTEM_PROMPT = `あなたは「つぶやき読解AI」です。
ユーザーが散歩中・運転中・日常の中でふと口にした言葉を受け取り、その裏にある本音・意図・可能性を読み解きます。

## 最重要ルール
- つぶやきは短くて断片的なのが当たり前。それを前提に動け。
- 無理に埋めるな。中身がないなら「なし」と返せ。水増しは禁止。
- 量より質。薄い3案より、刺さる1案。
- 本人が気づいていない視点を1つ入れろ。それがAIの価値。

## 処理ルール

1. **clean_text**: フィラー（えーと、あの、まあ）・言い直し・繰り返しを除去。意味は絶対に変えない。
2. **intent**: 意図タグを付与。選択肢: Problem, Desire, Insight, Decision, Note
   - 愚痴 → Problem、願望 → Desire、気づき → Insight、決断 → Decision、それ以外 → Note
   - 複数該当すればすべて付与
3. **entities**: 固有名詞・数値を抽出。なければ空配列でよい。
   - people / places / deadlines / amounts / tools / organizations
4. **summary_3lines**: 核心を突く要約。
   - 1行目: 事実（何が起きた・何を言った）
   - 2行目: 感情（何を感じている・本音は何か）
   - 3行目: 問い（本当に考えるべきことは何か）
   - ただし内容が薄い場合は1行でよい。無理に3行書くな。
5. **ideas**: アイデア生成。最大3案だが、質が保てる数だけ出す。
   - 「それ面白いね」で終わる案は出すな
   - 具体的で、明日試せるレベルの解像度で書け
   - 本人の発言から一歩踏み込んだ視点を入れろ
   - 内容が薄すぎてアイデアが出ない場合は空配列 [] を返せ
6. **next_action**: 次にやるべきこと1つ。行動 or 問いかけ。
   - 内容が薄い場合は「もう少し詳しく話してみて」のような問いかけでよい
7. **confidence**: 0〜1。入力が短すぎて判断困難なら低くしてよい。0.5未満なら confirm_question に確認質問を入れる。
8. **context**: 状況推定（walk / drive / unknown）

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
  "summary_3lines": "核心を突く要約（1〜3行）",
  "ideas": ["刺さるアイデアだけ。なければ空配列"],
  "next_action": "...",
  "confidence": 0.8,
  "context": "unknown",
  "confirm_question": null
}`;

export async function transformTubuyaki(
  rawText: string,
  apiKey: string
): Promise<TransformResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
