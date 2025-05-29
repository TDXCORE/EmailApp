"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  ImageIcon,
  Type,
  Palette,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"visual" | "html" | "preview">("visual")
  const [htmlContent, setHtmlContent] = useState(value)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHtmlContent(value)
  }, [value])

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    updateContent()
  }

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      setHtmlContent(content)
      onChange(content)
    }
  }

  const handleHtmlChange = (newHtml: string) => {
    setHtmlContent(newHtml)
    onChange(newHtml)
    if (editorRef.current) {
      editorRef.current.innerHTML = newHtml
    }
  }

  const insertLink = () => {
    const url = prompt("Ingresa la URL:")
    if (url) {
      execCommand("createLink", url)
    }
  }

  const insertImage = () => {
    const url = prompt("Ingresa la URL de la imagen:")
    if (url) {
      execCommand("insertImage", url)
    }
  }

  const changeFontSize = () => {
    const size = prompt("Tamaño de fuente (1-7):")
    if (size && Number.parseInt(size) >= 1 && Number.parseInt(size) <= 7) {
      execCommand("fontSize", size)
    }
  }

  const changeTextColor = () => {
    const color = prompt("Color del texto (hex):")
    if (color) {
      execCommand("foreColor", color)
    }
  }

  const ToolbarButton = ({
    onClick,
    children,
    title,
  }: {
    onClick: () => void
    children: React.ReactNode
    title: string
  }) => (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} title={title} className="h-8 w-8 p-0">
      {children}
    </Button>
  )

  return (
    <div className="border rounded-lg overflow-hidden">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <div className="border-b bg-gray-50 p-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visual" className="m-0">
          {/* Toolbar */}
          <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
            <ToolbarButton onClick={() => execCommand("bold")} title="Negrita">
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand("italic")} title="Cursiva">
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand("underline")} title="Subrayado">
              <Underline className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <ToolbarButton onClick={() => execCommand("justifyLeft")} title="Alinear izquierda">
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand("justifyCenter")} title="Centrar">
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand("justifyRight")} title="Alinear derecha">
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <ToolbarButton onClick={() => execCommand("insertUnorderedList")} title="Lista con viñetas">
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand("insertOrderedList")} title="Lista numerada">
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <ToolbarButton onClick={insertLink} title="Insertar enlace">
              <Link className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={insertImage} title="Insertar imagen">
              <ImageIcon className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <ToolbarButton onClick={changeFontSize} title="Tamaño de fuente">
              <Type className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={changeTextColor} title="Color del texto">
              <Palette className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[300px] p-4 focus:outline-none"
            style={{ minHeight: "300px" }}
            onInput={updateContent}
            onBlur={updateContent}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            suppressContentEditableWarning={true}
          />
        </TabsContent>

        <TabsContent value="html" className="m-0">
          <Textarea
            value={htmlContent}
            onChange={(e) => handleHtmlChange(e.target.value)}
            placeholder="Ingresa tu código HTML aquí..."
            className="min-h-[400px] font-mono text-sm border-0 rounded-none resize-none"
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="min-h-[400px] p-4 bg-white">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
