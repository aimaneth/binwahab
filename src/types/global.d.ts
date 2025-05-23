// Global type declarations
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
    performance: Performance;
  }
}

// Google Analytics gtag types
declare function gtag(
  command: 'config',
  targetId: string,
  config?: {
    page_title?: string;
    page_location?: string;
    custom_map?: Record<string, string>;
    [key: string]: any;
  }
): void;

declare function gtag(
  command: 'event',
  eventName: string,
  eventParameters?: {
    event_category?: string;
    event_label?: string;
    value?: number;
    custom_parameter_1?: string;
    [key: string]: any;
  }
): void;

declare function gtag(command: 'js', date: Date): void;
declare function gtag(command: 'set', config: Record<string, any>): void;

export {}; 