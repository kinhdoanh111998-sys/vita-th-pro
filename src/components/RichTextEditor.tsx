import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  Strikethrough,
  Quote,
  ImagePlus,
  Loader2,
  Table as TableIcon,
  Rows3,
  Columns3,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const BUCKET = "product-images";
const MAX_MB = 5;
// Bucket riêng tư -> phải dùng signed URL. Đặt TTL rất dài (~100 năm) để nhúng bền vững.
const SIGNED_TTL = 60 * 60 * 24 * 365 * 100;

async function uploadEditorImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Chỉ hỗ trợ file ảnh");
  if (file.size > MAX_MB * 1024 * 1024)
    throw new Error(`Ảnh vượt quá ${MAX_MB}MB`);
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `editor/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL);
  if (signErr || !data?.signedUrl) {
    throw signErr ?? new Error("Không tạo được liên kết ảnh");
  }
  return data.signedUrl;
}

function Btn({
  active,
  onClick,
  disabled,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`h-8 w-8 grid place-items-center rounded-md text-sm transition-colors ${
        active
          ? "bg-brand-primary text-white"
          : "text-ink-muted hover:bg-brand-bg hover:text-ink"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onPickImage,
  uploading,
}: {
  editor: Editor;
  onPickImage: () => void;
  uploading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-hairline bg-brand-bg/40 p-1.5 rounded-t-md">
      <Btn
        title="In đậm"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </Btn>
      <Btn
        title="In nghiêng"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </Btn>
      <Btn
        title="Gạch ngang"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={14} />
      </Btn>
      <span className="w-px h-5 bg-hairline mx-1" />
      <Btn
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 size={14} />
      </Btn>
      <Btn
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <Heading3 size={14} />
      </Btn>
      <span className="w-px h-5 bg-hairline mx-1" />
      <Btn
        title="Danh sách chấm"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </Btn>
      <Btn
        title="Danh sách số"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} />
      </Btn>
      <Btn
        title="Trích dẫn"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={14} />
      </Btn>
      <span className="w-px h-5 bg-hairline mx-1" />
      <Btn
        title="Căn trái"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={14} />
      </Btn>
      <Btn
        title="Căn giữa"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={14} />
      </Btn>
      <Btn
        title="Căn phải"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={14} />
      </Btn>
      <span className="w-px h-5 bg-hairline mx-1" />
      <Btn
        title="Chèn ảnh (hoặc dán/kéo thả trực tiếp)"
        disabled={uploading}
        onClick={onPickImage}
      >
        {uploading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ImagePlus size={14} />
        )}
      </Btn>
      <span className="w-px h-5 bg-hairline mx-1" />
      <Btn
        title="Hoàn tác"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={14} />
      </Btn>
      <Btn
        title="Làm lại"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={14} />
      </Btn>
      <span className="w-px h-5 bg-hairline mx-1" />
      <Btn
        title="Chèn bảng 3x3"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
      >
        <TableIcon size={14} />
      </Btn>
      <Btn
        title="Thêm hàng phía dưới"
        disabled={!editor.can().addRowAfter()}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <Rows3 size={14} />
      </Btn>
      <Btn
        title="Thêm cột bên phải"
        disabled={!editor.can().addColumnAfter()}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        <Columns3 size={14} />
      </Btn>
      <Btn
        title="Xóa bảng"
        disabled={!editor.can().deleteTable()}
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <Trash2 size={14} />
      </Btn>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập mô tả chi tiết...",
  minHeight = 200,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertImage = useCallback(
    async (file: File, editor: Editor) => {
      try {
        setUploading(true);
        const url = await uploadEditorImage(file);
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Không tải được ảnh lên",
        );
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-lg my-3 max-w-full h-auto",
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none px-3 py-3 min-h-[200px]",
      },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files || []).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((f) => insertImage(f, editorRef.current!));
        return true;
      },
      handleDrop(view, event) {
        const dt = event.dataTransfer;
        if (!dt) return false;
        const files = Array.from(dt.files || []).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((f) => insertImage(f, editorRef.current!));
        return true;
      },
    },
    immediatelyRender: false,
  });

  // Keep a ref so handlePaste/handleDrop can access the editor after mount
  const editorRef = useRef<Editor | null>(null);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Sync external value updates (e.g., when opening edit dialog)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    if (!value && current !== "<p></p>") {
      editor.commands.setContent("", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className="border border-hairline rounded-md bg-brand-bg/30"
        style={{ minHeight: minHeight + 40 }}
      />
    );
  }

  const onPickImage = () => fileInputRef.current?.click();

  return (
    <div className="border border-hairline rounded-md bg-white overflow-hidden">
      <Toolbar editor={editor} onPickImage={onPickImage} uploading={uploading} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImage(file, editor);
          e.target.value = "";
        }}
      />
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
