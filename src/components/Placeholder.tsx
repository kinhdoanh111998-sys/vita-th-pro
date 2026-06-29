export function Placeholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-20">
      <h1 className="text-4xl font-black text-brand-dark">{title}</h1>
    </div>
  );
}
