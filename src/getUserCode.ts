import * as monaco from "monaco-editor";
import { compileTS } from "./compileTs";
import { handleWidgets, patchWidgetCode } from "./handleWidgets";

type UserModule = {
	RESOLUTION?: number;
	PAUSE?: boolean | (() => boolean);
	RATE?: number;
	density: (pos: any) => any | null;
}

// assuming `editor` is your monaco instance:
export async function getUserCode(editor: monaco.editor.IStandaloneCodeEditor): Promise<UserModule> {
	const model = editor.getModel();
	handleWidgets(editor);

	let js = await compileTS(model!);
	js = patchWidgetCode(js);

	console.log(js)

	// ⚠️ only if you trust the code
	// inside runUserCode
	const blob = new Blob([js], { type: "application/javascript" });
	const url = URL.createObjectURL(blob);
	const module = await import(/* @vite-ignore */url);
	URL.revokeObjectURL(url);

	return module; // now this works

}
