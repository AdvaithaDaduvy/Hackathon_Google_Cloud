"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File | null, dataUri: string | null) => void
  accept?: string
  className?: string
  placeholder?: string
}

export function FileUpload({
  onFileSelect,
  accept = "image/*",
  className,
  placeholder = "Upload image",
}: FileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUri = e.target?.result as string
      setPreview(dataUri)
      onFileSelect(file, dataUri)
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreview(null)
    onFileSelect(null, null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-border",
          "hover:border-primary/50 hover:bg-primary/5",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {preview ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview || "/placeholder.svg"}
                alt="Preview"
                className="max-w-full max-h-48 mx-auto rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">{selectedFile?.name}</p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{placeholder}</p>
              <p className="text-xs text-muted-foreground">Drag and drop or click to browse</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
