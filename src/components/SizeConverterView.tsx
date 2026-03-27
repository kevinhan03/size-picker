import { Globe } from 'lucide-react';
import type { SizeCategory, SizeConversionRow, SizeGender, SizeRegionKey } from '../types';
import { SIZE_REGION_OPTIONS } from '../constants';

interface SizeConverterViewProps {
  sizeCategory: SizeCategory;
  setSizeCategory: (c: SizeCategory) => void;
  sizeGender: SizeGender;
  setSizeGender: (g: SizeGender) => void;
  sizeRegion: SizeRegionKey;
  setSizeRegion: (r: SizeRegionKey) => void;
  sizeValue: string;
  setSizeValue: (v: string) => void;
  sizeRows: SizeConversionRow[];
  sizeOptions: string[];
  convertedSize: SizeConversionRow | null | undefined;
  activeConverterRowIndex: number | null;
  setActiveConverterRowIndex: (i: number) => void;
}

export function SizeConverterView({
  sizeCategory,
  setSizeCategory,
  sizeGender,
  setSizeGender,
  sizeRegion,
  setSizeRegion,
  sizeValue,
  setSizeValue,
  sizeRows,
  sizeOptions,
  convertedSize,
  activeConverterRowIndex,
  setActiveConverterRowIndex,
}: SizeConverterViewProps) {
  const getRowCellClassName = (isActive: boolean) =>
    `px-2 py-2.5 whitespace-nowrap transition-all duration-200 sm:px-3 sm:py-3 ${
      isActive
        ? 'bg-gray-100 text-black'
        : 'bg-transparent text-gray-200 group-hover:bg-gray-100 group-hover:text-black'
    }`;

  return (
    <div className="w-full max-w-[72rem]">
      <div className="overflow-hidden rounded-[24px] border border-gray-800 bg-gray-950 shadow-2xl">
        <div className="border-b border-gray-800 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.24),_transparent_35%),linear-gradient(135deg,_rgba(17,24,39,0.96),_rgba(2,6,23,0.98))] px-3.5 py-4 sm:px-5 sm:py-6 md:px-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300 sm:text-xs">
            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Global Size Converter
          </div>
          <h2 className="mt-3 text-[1.45rem] font-black tracking-tight text-white sm:text-[1.75rem] md:text-[2rem]">해외사이즈 변환기</h2>
          <p className="mt-2 max-w-2xl text-[11px] leading-5 text-gray-300 sm:text-xs sm:leading-5 md:text-sm">
            의류와 신발 카테고리 기준으로 한국, 일본, US, EU, UK 사이즈를 한 번에 비교할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-5 md:grid-cols-[240px,minmax(0,1fr)] md:px-6 md:py-6">
          <section className="rounded-[22px] border border-gray-800 bg-black/30 p-3.5 sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-xs">Category</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSizeCategory('clothing')}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${
                  sizeCategory === 'clothing'
                    ? 'border-orange-500 bg-orange-500 text-black'
                    : 'border-gray-800 bg-gray-900 text-gray-200 hover:border-orange-500 hover:text-orange-400'
                }`}
              >
                의류
              </button>
              <button
                type="button"
                onClick={() => setSizeCategory('shoes')}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${
                  sizeCategory === 'shoes'
                    ? 'border-orange-500 bg-orange-500 text-black'
                    : 'border-gray-800 bg-gray-900 text-gray-200 hover:border-orange-500 hover:text-orange-400'
                }`}
              >
                신발
              </button>
            </div>

            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:mt-5 sm:text-xs">
              Gender
            </label>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSizeGender('men')}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${
                  sizeGender === 'men'
                    ? 'border-orange-500 bg-orange-500 text-black'
                    : 'border-gray-800 bg-gray-900 text-gray-200 hover:border-orange-500 hover:text-orange-400'
                }`}
              >
                남성
              </button>
              <button
                type="button"
                onClick={() => setSizeGender('women')}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${
                  sizeGender === 'women'
                    ? 'border-orange-500 bg-orange-500 text-black'
                    : 'border-gray-800 bg-gray-900 text-gray-200 hover:border-orange-500 hover:text-orange-400'
                }`}
              >
                여성
              </button>
            </div>

            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:mt-5 sm:text-xs">
              Input Region
            </label>
            <select
              value={sizeRegion}
              onChange={(event) => setSizeRegion(event.target.value as SizeRegionKey)}
              className="mt-2.5 w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-2.5 text-xs text-white outline-none transition focus:border-orange-500 sm:px-4 sm:py-3 sm:text-sm"
            >
              {SIZE_REGION_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:mt-5 sm:text-xs">
              Size
            </label>
            <select
              value={sizeValue}
              onChange={(event) => setSizeValue(event.target.value)}
              className="mt-2.5 w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-2.5 text-xs text-white outline-none transition focus:border-orange-500 sm:px-4 sm:py-3 sm:text-sm"
            >
              {sizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-[22px] border border-gray-800 bg-gray-900/60 p-3.5 sm:p-4 md:p-5">
            <div className="flex flex-col gap-2.5 border-b border-gray-800 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-xs">Selected</p>
                <h3 className="mt-1.5 text-base font-bold text-white sm:text-xl">
                  {sizeGender === 'men' ? '남성' : '여성'} {sizeCategory === 'clothing' ? '의류' : '신발'} {sizeRegion.toUpperCase()} {sizeValue}
                </h3>
              </div>
              <p className="text-[11px] leading-5 text-gray-400 sm:text-xs">선택한 사이즈를 5개 국가 기준으로 동시에 보여줍니다.</p>
            </div>

            {convertedSize ? (
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5">
                {SIZE_REGION_OPTIONS.map((option) => (
                  <div key={option.key} className="rounded-xl border border-gray-800 bg-black/40 p-2.5 sm:p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 sm:text-xs">
                      {option.label}
                    </p>
                    <p className="mt-1.5 text-lg font-black text-white sm:mt-2 sm:text-2xl">{convertedSize[option.key]}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-4 text-xs text-red-200 sm:text-sm">
                선택한 조건에 맞는 사이즈를 찾지 못했습니다.
              </div>
            )}

            <div className="mt-5 overflow-x-auto rounded-xl border border-gray-800">
              <table className="min-w-full w-max text-left text-[10px] text-gray-200 sm:text-xs">
                <thead className="bg-gray-950 text-[9px] uppercase tracking-[0.14em] text-gray-500 sm:text-[11px] sm:tracking-[0.16em]">
                  <tr>
                    <th className="border-r border-gray-800 px-2 py-2.5 whitespace-nowrap sm:px-3 sm:py-3">Size</th>
                    {SIZE_REGION_OPTIONS.map((option) => (
                      <th key={option.key} className="px-2 py-2.5 whitespace-nowrap sm:px-3 sm:py-3">
                        {option.key.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeRows.map((row, rowIndex) => {
                    const isActive = activeConverterRowIndex === rowIndex;
                    return (
                      <tr
                        key={row.label}
                        onClick={() => setActiveConverterRowIndex(rowIndex)}
                        className="group cursor-pointer border-t border-gray-800 transition-transform duration-200 active:scale-95"
                      >
                        <td
                          className={`border-r border-gray-800 px-2 py-2.5 whitespace-nowrap font-semibold transition-all duration-200 sm:px-3 sm:py-3 ${
                            isActive
                              ? 'bg-gray-100 text-black'
                              : 'bg-transparent text-white group-hover:bg-gray-100 group-hover:text-black'
                          }`}
                        >
                          {row.label}
                        </td>
                        {SIZE_REGION_OPTIONS.map((option) => (
                          <td key={option.key} className={getRowCellClassName(isActive)}>
                            {row[option.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
