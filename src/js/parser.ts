export interface parserInterface {
    parse: (message: string) => HTMLSpanElement;
    process: (output: HTMLSpanElement, message_section: string, applied_classes: string[]) => HTMLSpanElement;
    classFor: (label: string) => string;
}

export const parser: parserInterface = {
    parse: (message: string) => {
        const output = document.createElement("span");
        return parser.process(output, message, ["parsed-message-segment"]);
    },

    process: (output: HTMLSpanElement, message_section: string, applied_classes: string[]) => {
        for (let index = 0; index < message_section.length - 2; index++) { // Don't check for tag-starts on the last two characters as it cannot start that close to the end

            const current = message_section[index];
            if (current == "*" || current == "~" || current == "`" || current == "_" || current == "^" || current == "+" || current == "-") {
                if (current == "`" && message_section[index + 1] == "`" && message_section[index + 2] == "`") {
                    // Multi-line code block
                    const end = message_section.indexOf("```", index + 3);
                    if (end > 0) {
                        const text_before = message_section.substring(0, index);
                        const text_inside = message_section.substring(index + 3, end);
                        const text_after = message_section.substring(end + 3, message_section.length);
                        const output_segment = document.createElement("span");
                        for (const class_name of applied_classes) {
                            output_segment.classList.add(class_name);
                        }
                        output_segment.textContent = text_before;
                        output.appendChild(output_segment);

                        // Process mid as it may nest
                        const extra_classes = applied_classes.slice();
                        extra_classes.push(parser.classFor(current));
                        if (current == "`") {
                            // One special case for mono-space.
                            // We don't process anything inside, take it verbatim
                            const output_segment = document.createElement("pre");
                            for (const class_name of extra_classes) {
                                output_segment.classList.add(class_name);
                            }
                            output_segment.textContent = text_inside;
                            output.appendChild(output_segment);
                        } else {
                            parser.process(output, text_inside, extra_classes);
                        }

                        // Process after this
                        return parser.process(output, text_after, applied_classes);
                    }
                } else {
                    const end = message_section.indexOf(current, index + 2); // Look for a pair. Assume we cannot have zero-size middle section, start one after
                    if (end > 0) {
                        const text_before = message_section.substring(0, index);
                        const text_inside = message_section.substring(index + 1, end);
                        const text_after = message_section.substring(end + 1, message_section.length);

                        // Add before this marker to output
                        if (text_before.length > 0) {
                            const output_segment = document.createElement("span");
                            for (const class_name of applied_classes) {
                                output_segment.classList.add(class_name);
                            }
                            output_segment.textContent = text_before;
                            output.appendChild(output_segment);
                        }
                        // Process mid as it may nest
                        const extra_classes = applied_classes.slice();
                        extra_classes.push(parser.classFor(current));
                        if (current == "`") {
                            // One special case for mono-space.
                            // We don't process anything inside, take it verbatim
                            const output_segment = document.createElement("span");
                            for (const class_name of extra_classes) {
                                output_segment.classList.add(class_name);
                            }
                            output_segment.textContent = text_inside;
                            output.appendChild(output_segment);
                        } else {
                            parser.process(output, text_inside, extra_classes);
                        }

                        // Process after this
                        if (text_after.length > 0) {
                            return parser.process(output, text_after, applied_classes);
                        }
                        return output;
                    }
                }
            }
        }
        // Fully iterated and found no tags
        const output_segment = document.createElement("span");
        for (const class_name of applied_classes) {
            output_segment.classList.add(class_name);
        }
        output_segment.textContent = message_section;
        output.appendChild(output_segment);
        return output;
    },

    classFor: (label: string) => {
        switch (label) {
            case "*":
                return "bold";
            case "~":
                return "strikethrough";
            case "_":
                return "italic";
            case "`":
                return "monospace";
            case "^":
                return "superscript";
            case "-":
                return "smaller";
            case "+":
                return "larger";

        }
        return "";
    }
}