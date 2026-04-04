export abstract class ClipboardService {
  abstract writeText(text: string): Promise<void>;
}
