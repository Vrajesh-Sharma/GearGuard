import clsx from "clsx";

export default function Button({ className, variant = "primary", ...props }) {
  const base = "px-4 py-2 rounded-md text-sm font-medium transition";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent hover:bg-gray-100",
  };
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
