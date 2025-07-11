declare module 'kuromoji' {
  export interface IpadicFeatures {
    word_id: number;
    word_type: string;
    word_position: number;
  }

  export interface TokenizerBuilder {
    build(callback: (err: Error | null, tokenizer: Tokenizer) => void): void;
  }

  export interface Tokenizer {
    tokenize(text: string): Array<{
      word_id: number;
      word_type: string;
      word_position: number;
      surface_form: string;
      pos: string;
      pos_detail_1: string;
      pos_detail_2: string;
      pos_detail_3: string;
      conjugated_type: string;
      conjugated_form: string;
      basic_form: string;
      reading: string;
      pronunciation: string;
      part_of_speech: string;
    }>;
  }

  export function builder(options: { dicPath: string }): TokenizerBuilder;
}
