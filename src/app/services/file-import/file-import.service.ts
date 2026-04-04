export abstract class FileImportService {
  abstract pickAndReadFile(): Promise<{ content: string; fileName: string } | null>;
}
