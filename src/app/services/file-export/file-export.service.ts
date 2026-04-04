export abstract class FileExportService {
  abstract download(content: string, fileName: string, mimeType: string): void;
}
