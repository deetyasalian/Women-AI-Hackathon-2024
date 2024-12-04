"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDFReport = void 0;
const web_api_1 = require("@slack/web-api");
const fs_1 = __importDefault(require("fs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
function generatePDFReport(analysis, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = new pdfkit_1.default();
        const tmpDir = "/tmp";
        const filePath = `${tmpDir}/report-${Date.now()}.pdf`;
        // Check if the /tmp directory exists and is writable
        if (!fs_1.default.existsSync(tmpDir)) {
            console.error(`Directory '${tmpDir}' does not exist.`);
            throw new Error("Temporary directory does not exist.");
        }
        try {
            fs_1.default.accessSync(tmpDir, fs_1.default.constants.W_OK); // Check if writable
            console.log(`Directory '${tmpDir}' is writable.`);
        }
        catch (err) {
            console.error(`Directory '${tmpDir}' is not writable:`, err);
            throw new Error("Temporary directory is not writable.");
        }
        // Generate the PDF
        doc
            .fontSize(18)
            .text("Sentiment Analysis Report", { align: "center" })
            .moveDown(1);
        doc.fontSize(12).text("Summary of Analysis:").moveDown(0.5);
        doc.text(analysis, { align: "left" }).moveDown(1);
        doc.fontSize(12).text("Conversation Details:").moveDown(0.5);
        data.forEach((entry, index) => {
            doc.text(`#${index + 1} - ID: ${entry.id}, Text: ${entry.text}, Score: ${entry.score}, Emotion: ${entry.emotion}`);
        });
        yield new Promise((resolve, reject) => {
            const stream = fs_1.default.createWriteStream(filePath);
            stream.on("error", (error) => {
                console.error("Error creating write stream:", error);
                reject(error);
            });
            stream.on("close", resolve);
            doc.pipe(stream);
            doc.end();
        });
        // Send the PDF to Slack
        const web = new web_api_1.WebClient("xoxb-8053907432021-8044517494999-9B2cbtjd0exK5Y4N0XGGXedE");
        const conversationId = "C081G4UHD54";
        try {
            yield web.files.uploadV2({
                channels: conversationId,
                file: fs_1.default.createReadStream(filePath),
                initial_comment: "Here's the sentiment analysis report.",
                filename: `Sentiment_Report_${Date.now()}.pdf`,
            });
            console.log("PDF report sent to Slack successfully!");
        }
        catch (error) {
            console.error("Error sending PDF to Slack:", error);
        }
        finally {
            // Clean up the generated PDF file after sending
            fs_1.default.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting PDF file:", err);
                }
                else {
                    console.log(`Temporary PDF file ${filePath} deleted.`);
                }
            });
        }
    });
}
exports.generatePDFReport = generatePDFReport;
