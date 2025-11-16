import * as monaco from "monaco-editor";

export async function compileTS(model: monaco.editor.ITextModel) {
	const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
	const worker = await getWorker(model.uri);

	const emit = await worker.getEmitOutput(model.uri.toString());

	const jsFile = emit.outputFiles.find(f => f.name.endsWith(".js"));
	if (!jsFile) throw new Error("No JS output");

	return jsFile.text;
}
