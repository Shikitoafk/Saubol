import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

interface QuestionImageProps {
  src?: string;
  className?: string;
}

/**
 * Картинка к вопросу — график, таблица, схема.
 *
 * Отдельный компонент нужен из-за поведения при ошибке. Раньше в семи
 * местах стоял голый <img>, и если файла по адресу не оказывалось, браузер
 * рисовал иконку битой картинки с подписью «Question visual». Понять по
 * ней, что именно не так — не тот путь, не то расширение, файл не
 * выложен, — невозможно. Теперь видно сам адрес и что с ним делать.
 */
export function QuestionImage({ src, className = "" }: QuestionImageProps) {
  const [failed, setFailed] = useState(false);

  // Вопрос сменился — пробуем загрузить заново.
  useEffect(() => setFailed(false), [src]);

  if (!src) return null;

  if (failed) {
    return (
      <div className="w-full max-w-xl rounded-2xl border border-dashed border-line-strong bg-surface-2 p-5 text-left">
        <div className="flex items-center gap-2 mb-2 text-ink-muted">
          <ImageOff className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Картинка к вопросу не загрузилась</span>
        </div>
        <p className="text-xs text-ink-subtle font-medium mb-2 leading-relaxed">
          Файл должен лежать в <code className="text-ink-muted">public/sat_images/</code> и
          называться ровно так, как записано в базе.
        </p>
        <code className="block text-xs text-ink-muted break-all bg-surface rounded-lg px-3 py-2 border border-line">
          {src}
        </code>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Иллюстрация к вопросу"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
