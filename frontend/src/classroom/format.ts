export const date = (value: string) => new Date(value).toLocaleDateString('ru-RU');

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось выполнить действие';
