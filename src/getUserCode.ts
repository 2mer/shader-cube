import * as monaco from "monaco-editor";
import { compileTS } from "./compileTs";

type UserModule = {
	RESOLUTION?: number;
	density: (pos: any) => any | null;
}

// assuming `editor` is your monaco instance:
export async function getUserCode(editor: monaco.editor.IStandaloneCodeEditor): Promise<UserModule> {
	const model = editor.getModel();
	const js = await compileTS(model!);

	// ⚠️ only if you trust the code
	// inside runUserCode
	const blob = new Blob([js], { type: "application/javascript" });
	const url = URL.createObjectURL(blob);
	const module = await import(/* @vite-ignore */url);
	URL.revokeObjectURL(url);

	return module; // now this works

}
