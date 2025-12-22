import { execSync } from "node:child_process";
import { NextResponse } from "next/server";

const MAJOR_VERSION = 1;

const getMinorVersion = () => {
  try {
    const output = execSync("git rev-list --merges --count HEAD", {
      encoding: "utf8",
    }).trim();

    const count = Number.parseInt(output, 10);

    if (Number.isNaN(count)) {
      return 0;
    }

    return count;
  } catch (error) {
    console.error("Erro ao calcular o número de merges:", error);
    return 0;
  }
};

export async function GET() {
  const minorVersion = getMinorVersion();
  const version = `${MAJOR_VERSION}.${minorVersion}`;

  return NextResponse.json({ version });
}
