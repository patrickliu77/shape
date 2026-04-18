import { useMemo, useState, useEffect } from "react";
import type { InteractiveSpec } from "../types";
import { FunctionPlot } from "./FunctionPlot";
import { play, stop } from "../lib/player";
import { useLang } from "../lib/lang";

type Props = {
  spec: InteractiveSpec;
  transcript?: string;
};

const STR = {
  en: { play: "▶ Play explanation", live: "Describe current", stop: "■ Stop" },
  ar: { play: "▶ تشغيل الشرح", live: "وصف الحالة دلوقتي", stop: "■ إيقاف" },
};

export function InteractiveView({ spec, transcript }: Props) {
  const { lang, dir } = useLang();
  const t = STR[lang];

  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(spec.params.map((p) => [p.name, p.default])),
  );

  useEffect(() => {
    setValues(Object.fromEntries(spec.params.map((p) => [p.name, p.default])));
    return () => stop();
  }, [spec]);

  const fn = useMemo(() => (x: number) => spec.fn(x, values), [spec, values]);

  const liveNarration = spec.narrate?.(values, lang);

  const onChange = (name: string, v: number) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  const speakTranscript = () => {
    if (transcript) play(transcript, lang);
  };

  const speakLive = () => {
    if (liveNarration) play(liveNarration, lang);
  };

  return (
    <div className="space-y-4">
      <FunctionPlot
        fn={fn}
        xRange={spec.xRange}
        yRange={spec.yRange}
        xLabel={spec.xLabel}
        yLabel={spec.yLabel}
      />

      <div className="space-y-3">
        {spec.params.map((p) => (
          <div key={p.name} className="flex items-center gap-3">
            <label className="text-xs font-mono text-stone-600 w-24 shrink-0">
              {p.label ?? p.name} = {values[p.name].toFixed(2)}
            </label>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={values[p.name]}
              onChange={(e) => onChange(p.name, parseFloat(e.target.value))}
              className="flex-1 accent-accent"
            />
          </div>
        ))}
      </div>

      {liveNarration && (
        <div
          dir={dir}
          className="text-sm text-stone-600 italic bg-stone-50 rounded-md p-3 border border-stone-200"
        >
          {liveNarration}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={speakTranscript}
          className="px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-violet-700 transition"
        >
          {t.play}
        </button>
        {liveNarration && (
          <button
            onClick={speakLive}
            className="px-3 py-1.5 text-sm bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-50 transition"
          >
            {t.live}
          </button>
        )}
        <button
          onClick={stop}
          className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 transition"
        >
          {t.stop}
        </button>
      </div>
    </div>
  );
}
