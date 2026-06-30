import svgPaths from "./svg-ycy07mjqo2";
type EditIconBtnProps = {
  className?: string;
  property1?: "secondary" | "primary" | "disabled";
};

function EditIconBtn({ className, property1 = "secondary" }: EditIconBtnProps) {
  const isDisabled = property1 === "disabled";
  const isPrimary = property1 === "primary";
  return (
    <div className={className || `content-stretch flex items-center justify-center relative rounded-[100px] size-[32px] ${isDisabled ? "bg-[#f6f6f6]" : isPrimary ? "bg-[#008ff0]" : "bg-[rgba(0,143,240,0.1)]"}`}>
      <div className="relative shrink-0 size-[12px]" data-name="Edit">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <g clipPath={isDisabled ? "url(#clip0_6_9282)" : isPrimary ? "url(#clip0_6_9285)" : "url(#clip0_1_2046)"} id="Edit">
            <path d={svgPaths.p3125e470} fill={isDisabled ? "var(--fill-0, #777777)" : isPrimary ? "var(--fill-0, white)" : "var(--fill-0, #008FF0)"} id="Vector" />
          </g>
          <defs>
            <clipPath id={isDisabled ? "clip0_6_9282" : isPrimary ? "clip0_6_9285" : "clip0_1_2046"}>
              <rect fill="white" height="12" width="12" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>
  );
}
type ComponentProps = {
  className?: string;
  property1?: "Default" | "Variant2";
};

export default function Component({ className, property1 = "Default" }: ComponentProps) {
  const isVariant2 = property1 === "Variant2";
  return (
    <button className={className || `bg-white content-stretch flex flex-col items-end relative rounded-[10px] w-[400px] ${isVariant2 ? "gap-[10px]" : "h-[68px] justify-center"}`}>
      <div className="h-[64px] relative shrink-0 w-full">
        <div aria-hidden={isVariant2 ? true : undefined} className={isVariant2 ? "absolute border-[rgba(23,28,35,0.05)] border-b border-solid inset-0 pointer-events-none" : "flex flex-row items-center justify-center size-full"}>
          {property1 === "Default" && (
            <div className="content-stretch flex items-center justify-between px-[20px] relative size-full">
              <div className="flex items-center justify-center relative shrink-0 size-[24px]">
                <div className="-rotate-90 -scale-y-100 flex-none">
                  <div className="relative size-[24px]" data-name="danger">
                    <div className="absolute contents inset-[10%]" data-name="vuesax/bulk/danger">
                      <div className="absolute inset-[10%]" data-name="danger">
                        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.2 19.2">
                          <g id="danger">
                            <path d={svgPaths.p57a751a} id="Vector" stroke="var(--stroke-0, #171C23)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                            <g id="Vector_2" opacity="0" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="[word-break:break-word] font-['Noto_Sans_Hebrew_New:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#171c23] text-[18px] text-right whitespace-nowrap" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                פרטי מלווים
              </p>
            </div>
          )}
        </div>
        {isVariant2 && (
          <div className="flex flex-row items-center justify-center size-full">
            <div className="content-stretch flex items-center justify-between px-[20px] relative size-full">
              <div className="flex items-center justify-center relative shrink-0 size-[24px]">
                <div className="flex-none rotate-90">
                  <div className="relative size-[24px]" data-name="danger">
                    <div className="absolute contents inset-[10%]" data-name="vuesax/bulk/danger">
                      <div className="absolute inset-[10%]" data-name="danger">
                        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.2 19.2">
                          <g id="danger">
                            <path d={svgPaths.p57a751a} id="Vector" stroke="var(--stroke-0, #171C23)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                            <g id="Vector_2" opacity="0" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex items-center relative shrink-0">
                <p className="[word-break:break-word] font-['Noto_Sans_Hebrew_New:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#171c23] text-[18px] text-right whitespace-nowrap" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                  פרטי מלווים
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {isVariant2 && (
        <>
          <div className="relative shrink-0 w-full">
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex items-center justify-between px-[20px] relative size-full">
                <div className="bg-[#008ff0] content-stretch flex h-[32px] items-center justify-center px-[15px] relative rounded-[100px] shrink-0" data-name="Buttons">
                  <div className="content-stretch flex items-center justify-center pb-[2px] relative shrink-0">
                    <div className="[word-break:break-word] flex flex-col font-['Noto_Sans_Hebrew_New:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-right text-white whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                      <p className="leading-[normal]" dir="auto">
                        הוספת מלווה
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-center relative shrink-0">
                  <p className="[word-break:break-word] font-['Noto_Sans_Hebrew_New:Regular',sans-serif] font-normal leading-[normal] opacity-50 relative shrink-0 text-[#171c23] text-[15px] text-right whitespace-nowrap" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                    ניתן להוסיף עד שני מלווים
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative shrink-0 w-full">
            <div className="flex flex-col items-end size-full">
              <div className="content-stretch flex flex-col items-end pb-[20px] px-[20px] relative size-full">
                <div className="content-stretch flex flex-col gap-[20px] items-end relative shrink-0 w-full">
                  <div className="content-stretch flex gap-[10px] items-center justify-end relative shrink-0">
                    <EditIconBtn className="bg-[rgba(0,143,240,0.1)] content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[32px]" />
                    <div className="[word-break:break-word] flex flex-col font-['Noto_Sans_Hebrew_New:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#171c23] text-[16px] text-right whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                      <p className="leading-[normal]" dir="auto">
                        עובדת סוציאלית
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[20px] items-end relative shrink-0 w-full">
                    <div className="content-stretch flex items-start relative shrink-0">
                      <div className="[word-break:break-word] content-stretch flex flex-col font-['Noto_Sans_Hebrew_New:Regular',sans-serif] font-normal items-end leading-[normal] min-w-[118px] relative shrink-0 text-[#171c23] text-[15px] text-right whitespace-nowrap">
                        <p className="opacity-50 relative shrink-0" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                          שם מלא
                        </p>
                        <p className="relative shrink-0" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                          רונית כץ
                        </p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col font-normal items-end leading-[normal] min-w-[118px] relative shrink-0 text-[#171c23] text-[15px] text-right whitespace-nowrap">
                      <p className="font-['Noto_Sans_Hebrew_New:Regular',sans-serif] opacity-50 relative shrink-0" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                        תעודת זהות
                      </p>
                      <p className="font-['Noto_Sans_Hebrew_New:Regular','Noto_Sans:Regular',sans-serif] relative shrink-0" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                        211716293
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-normal gap-[20px] items-start leading-[normal] relative shrink-0 text-[#171c23] text-[15px] text-right whitespace-nowrap">
                      <div className="content-stretch flex flex-col items-end min-w-[118px] relative shrink-0">
                        <p className="font-['Noto_Sans_Hebrew_New:Regular',sans-serif] opacity-50 relative shrink-0" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>{`אימייל `}</p>
                        <p className="font-['Noto_Sans_Hebrew_New:Regular','Noto_Sans:Regular',sans-serif] relative shrink-0" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                          dani@gmail.com
                        </p>
                      </div>
                      <div className="content-stretch flex flex-col items-end min-w-[118px] relative shrink-0">
                        <p className="font-['Noto_Sans_Hebrew_New:Regular',sans-serif] opacity-50 relative shrink-0" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                          טלפון
                        </p>
                        <p className="font-['Noto_Sans_Hebrew_New:Regular','Noto_Sans:Regular',sans-serif] relative shrink-0" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                          0500000000
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex h-[40px] items-center justify-between relative shrink-0 w-full">
                    <div className="bg-[rgba(0,143,240,0.1)] content-stretch flex h-[32px] items-center justify-center px-[15px] relative rounded-[100px] shrink-0" data-name="Buttons">
                      <div className="content-stretch flex items-center justify-center pb-[2px] relative shrink-0">
                        <div className="[word-break:break-word] flex flex-col font-['Noto_Sans_Hebrew_New:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#008ff0] text-[16px] text-right whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                          <p className="leading-[normal]" dir="auto">
                            הסרת הרשאה
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col font-['Noto_Sans_Hebrew_New:Regular',sans-serif] font-normal items-end leading-[normal] min-w-[118px] relative text-[#171c23] text-[15px] text-right whitespace-nowrap">
                      <p className="opacity-50 relative shrink-0" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                        סטטוס הרשאה
                      </p>
                      <p className="relative shrink-0" dir="auto" style={{ fontVariationSettings: '"wdth" 100' }}>
                        מאושרת
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </button>
  );
}