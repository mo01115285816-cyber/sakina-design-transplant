import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  togglePassword?: boolean;
};

export const GlassInput = forwardRef<HTMLInputElement, Props>(function GlassInput(
  { label, icon, togglePassword, type = "text", className = "", id, ...rest },
  ref,
) {
  const [show, setShow] = useState(false);
  const inputType = togglePassword ? (show ? "text" : "password") : type;
  const inputId = id ?? `auth-${label}`;

  return (
    <div className="group relative">
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-bold text-[#7f6a55]">
        {label}
      </label>
      <div className="cut-crystal-input relative flex items-center rounded-2xl border border-[#2b1a10]/10 transition-all duration-200 focus-within:border-[#b88a4f] focus-within:ring-2 focus-within:ring-[#deab65]/20">
        {icon && <span className="pr-3 pl-1 text-[#b88a4f]/80">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={`peer w-full bg-transparent px-4 py-3.5 text-[15px] text-[#2b1a10] placeholder:text-[#7f6a55]/45 outline-none ${className}`}
          {...rest}
        />
        {togglePassword && (
          <button
            type="button"
            onClick={() => setShow((visible) => !visible)}
            className="mx-2 rounded-full p-1.5 text-[#7f6a55]/70 transition hover:bg-[#f7f2ea] hover:text-[#b88a4f]"
            aria-label={show ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
});
