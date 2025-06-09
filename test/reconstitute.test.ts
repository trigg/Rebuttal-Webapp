import { create_app } from "../src/js/app";
let rebuttal_app = create_app(true);
describe("App and Client reconstitute HTML correct", () => {
    it("Accepts a simple HTML entity", () => {
        expect(rebuttal_app.reconstitute("<br>", {}).outerHTML).toBe("<br>");
    });

    it("Accepts elements with classes", () => {
        expect(rebuttal_app.reconstitute("<img srg='here.png' class='none'>", {}).outerHTML).toBe("<img srg=\"here.png\" class=\"none\">");
    });

    it("Generates element when needed", () => {
        expect(rebuttal_app.get_or_reconstitute('image', "<img id='image' src='test.png'>", {}).outerHTML).toBe("<img id=\"image\" src=\"test.png\">");
    });

    it("Returns existing element when found in DOM", () => {
        let div = document.createElement("div");
        div.id = "image";
        document.getElementsByTagName("body")[0].appendChild(div);
        expect(rebuttal_app.get_or_reconstitute('image', "<img id='image' src='test.png'>", {}).outerHTML).toBe("<div id=\"image\"></div>");
    });

    it("Feeds values in to constructed element", () => {
        expect(rebuttal_app.reconstitute('<{{tag}} id=\'{{id}}\' class=\'{{id}}\'>', { tag: 'img', id: 'alsoimg' }).outerHTML).toBe("<img id=\"alsoimg\" class=\"alsoimg\">");
    });
    it("Populates theme automatically", () => {
        expect(rebuttal_app.reconstitute("<img src='{{theme}}'>", {}).outerHTML).toBe("<img src=\"bubblegum\">");
    })
    it("Chokes on bad html", () => {
        expect(() => { rebuttal_app.reconstitute("<This isn't html.", {}) }).toThrow("Invalid reconstitution of HTML");
    })
})
