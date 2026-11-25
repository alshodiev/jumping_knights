/**
 * Makes the value for COACH_PASSWORD_HASH.   Run:  npm run hash-password
 * Your password is typed here (nothing is shown while typing) and never saved.
 * Only the scrambled hash is printed.
 */
import { hashPassword } from "../src/auth.js";

const stdin = process.stdin;
let piped: string[] | null = null; // used only when input is piped in (not typed)

async function ask(question: string): Promise<string> {
  process.stdout.write(question);
  if (!stdin.isTTY) {
    if (!piped) {
      let all = "";
      for await (const chunk of stdin) all += chunk;
      piped = all.split(/\r?\n/);
    }
    process.stdout.write("\n");
    return piped.shift() ?? "";
  }
  return new Promise((resolve) => {
    let typed = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const finish = () => { stdin.setRawMode(false); stdin.pause(); stdin.off("data", onData); process.stdout.write("\n"); };
    const onData = (data: string) => {
      for (const c of data) {
        if (c === "\r" || c === "\n") { finish(); return resolve(typed); }
        if (c === "\u0003") { finish(); process.exit(130); } // Ctrl-C
        if (c === "\u007f" || c === "\b") typed = typed.slice(0, -1);
        else if (c >= " ") typed += c; // also handles pasted text
      }
    };
    stdin.on("data", onData);
  });
}

const a = await ask("Choose your coach password (12+ characters recommended): ");
if (a.length < 10) { console.error("Too short. Use at least 10 characters."); process.exit(1); }
const b = await ask("Type it again: ");
if (a !== b) { console.error("The two entries did not match."); process.exit(1); }
console.log("\nPut this line in backend/.env (and in Render's Environment tab, value only):\n");
console.log(`COACH_PASSWORD_HASH=${await hashPassword(a)}\n`);
