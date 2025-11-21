import * as monaco from "monaco-editor";


let decorations: string[] = [];

type Widget = {
	regex: RegExp;
	instances: string[];
	values: Map<string, any>;
	className: string;
	generateComponent: (id: string, match: RegExpExecArray) => HTMLElement;
	transpile: (id: string, defaultValue: string) => string;
}

const widgets: Record<string, Widget> = {
	slider: {
		regex: /slider\s*\(\s*([^)]+)\s*\)/g,
		instances: [] as string[],
		values: new Map<string, number>(),
		className: "inline-slider-spacer",
		generateComponent(id: string, match: RegExpExecArray) {
			const initialValue = String(widgets.slider.values.get(id) ?? match[1].trim());
			const slider = document.createElement("input");
			slider.type = "range";
			slider.min = "0";
			slider.max = "1";
			slider.step = "0.01";
			slider.value = initialValue;
			slider.className = "inline-slider";
			slider.id = id;
			slider.oninput = (e => {
				const val = parseFloat((e.target as HTMLInputElement).value);
				widgets.slider.values.set(id, val);
			})

			return slider;
		},
		transpile(id, defaultValue) {
			return `Number(widgets.slider.values.get("${id}") ?? ${defaultValue})`;
		},
	},

	checkbox: {
		regex: /checkbox\s*\(\s*([^)]+)\s*\)/g,
		instances: [] as string[],
		values: new Map<string, boolean>(),
		className: "inline-checkbox-spacer",
		generateComponent(id: string, match: RegExpExecArray) {
			const initialValue = String(widgets.slider.values.get(id) ?? match[1].trim()) === 'true';
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.checked = initialValue;
			checkbox.className = "inline-checkbox";
			checkbox.id = id;
			checkbox.onchange = (e => {
				const val = (e.target as HTMLInputElement).checked;
				widgets.checkbox.values.set(id, val);
			})

			return checkbox;
		},
		transpile(id, defaultValue) {
			return `Boolean(widgets.checkbox.values.get("${id}") ?? ${defaultValue})`;
		},
	}
};

(window as any).widgets = widgets;

export function handleWidgets(editor: monaco.editor.IStandaloneCodeEditor) {

	let widgetCounter = 0;

	// Remove all old widget DOMs
	document.querySelectorAll(".inline-slider").forEach(e => e.remove());
	document.querySelectorAll(".inline-checkbox").forEach(e => e.remove());

	editor.deltaDecorations(decorations, []);
	decorations = [];

	const model = editor.getModel()!;
	const fullText = model.getValue();

	let match;
	let newDecorations = [];


	for (const [widgetName, widget] of Object.entries(widgets)) {
		const oldInstances = new Set(widget.instances);
		widget.instances = [];

		while ((match = widget.regex.exec(fullText))) {
			const index = match.index;
			const start = model.getPositionAt(index);
			// const argStart = model.getPositionAt(index + match[0].indexOf("(") + match[1].length);
			const argStart = model.getPositionAt(index + match[0].indexOf("("));
			// const argEnd = model.getPositionAt(index + match[0].lastIndexOf(")"));
			const argEnd = model.getPositionAt(index + match[0].indexOf("(") + 1);

			const id = widgetName + "_" + (widgetCounter++);
			widget.instances.push(id);

			oldInstances.delete(id);

			// 1. Create a decoration that *replaces* the argument with layout-affecting inline block
			newDecorations.push({
				range: new monaco.Range(argStart.lineNumber, argStart.column, argEnd.lineNumber, argEnd.column),
				options: {
					inlineClassName: widget.className,
					inlineClassNameAffectsLetterSpacing: true
				}
			});


			// 2. Create a DOM slider placed inside that inline block
			const el = widget.generateComponent(id, match);

			document.body.appendChild(el);

			const editorEl = editor.getDomNode()!;

			// Reposition on scroll/resize
			function updatePos() {
				const widgetRange = new monaco.Range(argStart.lineNumber, argStart.column, argStart.lineNumber, argStart.column);
				const coords = editor.getScrolledVisiblePosition(widgetRange.getStartPosition());
				if (!coords) return;

				el.style.left = coords.left + 7 + "px";
				el.style.top = coords.top + editorEl.getBoundingClientRect().top + 1 + "px";
			}

			updatePos();
			editor.onDidScrollChange(updatePos);
			editor.onDidChangeCursorPosition(updatePos);
		}

		oldInstances.forEach(id => {
			widgets.slider.values.delete(id);
		});
	}

	// while ((match = widgets.slider.regex.exec(fullText))) {
	// 	const index = match.index;
	// 	const start = model.getPositionAt(index);
	// 	// const argStart = model.getPositionAt(index + match[0].indexOf("(") + match[1].length);
	// 	const argStart = model.getPositionAt(index + match[0].indexOf("("));
	// 	// const argEnd = model.getPositionAt(index + match[0].lastIndexOf(")"));
	// 	const argEnd = model.getPositionAt(index + match[0].indexOf("(") + 1);

	// 	const id = "slider_" + (widgetCounter++);
	// 	widgets.slider.instances.push(id);

	// 	oldInstances.delete(id);

	// 	// 1. Create a decoration that *replaces* the argument with layout-affecting inline block
	// 	newDecorations.push({
	// 		range: new monaco.Range(argStart.lineNumber, argStart.column, argEnd.lineNumber, argEnd.column),
	// 		options: {
	// 			inlineClassName: "inline-spacer",
	// 			inlineClassNameAffectsLetterSpacing: true
	// 		}
	// 	});


	// 	// 2. Create a DOM slider placed inside that inline block

	// 	const el =
	// 		document.body.appendChild(slider);

	// 	const editorEl = editor.getDomNode()!;

	// 	// Reposition on scroll/resize
	// 	function updatePos() {
	// 		const widgetRange = new monaco.Range(argStart.lineNumber, argStart.column, argStart.lineNumber, argStart.column);
	// 		const coords = editor.getScrolledVisiblePosition(widgetRange.getStartPosition());
	// 		if (!coords) return;

	// 		slider.style.left = coords.left + 7 + "px";
	// 		slider.style.top = coords.top + editorEl.getBoundingClientRect().top + 1 + "px";
	// 	}

	// 	updatePos();
	// 	editor.onDidScrollChange(updatePos);
	// 	editor.onDidChangeCursorPosition(updatePos);
	// }

	decorations = editor.deltaDecorations(decorations, newDecorations);

}

export function patchWidgetCode(js: string): string {

	let output = js;

	for (const [_, widget] of Object.entries(widgets)) {

		const remainingElements = Array.from(widget.instances);

		output = output.replace(widget.regex, (_, p1) => {
			const id = remainingElements.shift()!;
			return widget.transpile(id, p1);
		});

	}

	return output;

}