import { parser } from '../src/js/parser';

describe('Parser', () => {

    test('parses nothing', () => {
        expect(parser.parse("A value").innerHTML).toBe(
            "<span class=\"parsed-message-segment\">A value</span>");
    });
    test('parses singl tab in text', () => {

        expect(parser.parse("A *bold* text").innerHTML).toBe(
            "<span class=\"parsed-message-segment\">A </span><span class=\"parsed-message-segment bold\">bold</span><span class=\"parsed-message-segment\"> text</span>"
        );
    });
    test('parses two of the same tags', () => {
        expect(parser.parse("*A* bold *thing* too").innerHTML).toBe(
            "<span class=\"parsed-message-segment bold\">A</span><span class=\"parsed-message-segment\"> bold </span><span class=\"parsed-message-segment bold\">thing</span><span class=\"parsed-message-segment\"> too</span>"
        )
    });
    test('parses two nested different tags', () => {
        expect(parser.parse("*_thing_*").innerHTML).toBe(
            "<span class=\"parsed-message-segment bold italic\">thing</span>"
        );
    });
    test('parses different tags nested inside one', () => {
        expect(parser.parse("*_this_ +is+ -not- ~sparta~*").innerHTML).toBe(
            "<span class=\"parsed-message-segment bold italic\">this</span><span class=\"parsed-message-segment bold\"> </span><span class=\"parsed-message-segment bold larger\">is</span><span class=\"parsed-message-segment bold\"> </span><span class=\"parsed-message-segment bold smaller\">not</span><span class=\"parsed-message-segment bold\"> </span><span class=\"parsed-message-segment bold strikethrough\">sparta</span>"
        );
    });
    test('parses tags that aren\'t tags', () => {
        expect(parser.parse("minitruth says 1 + 1 = 3. Except now 2 - 1 = 21").innerHTML).toBe(
            "<span class=\"parsed-message-segment\">minitruth says 1 + 1 = 3. Except now 2 - 1 = 21</span>"
        );
    });
    test('skips parsing an empty tag at start', () => {
        expect(parser.parse("** double asterisk").innerHTML).toBe(
            "<span class=\"parsed-message-segment\">** double asterisk</span>"
        );
    });
    test('skips parsing an empty tag at end', () => {
        expect(parser.parse("double asterisk **").innerHTML).toBe(
            "<span class=\"parsed-message-segment\">double asterisk **</span>"
        );
    });
    test('skips parsing an empty tag in text', () => {
        expect(parser.parse("double ** asterisk").innerHTML).toBe(
            "<span class=\"parsed-message-segment\">double ** asterisk</span>"
        );
    });
});
