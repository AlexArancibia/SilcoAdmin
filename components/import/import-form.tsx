"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileSpreadsheet, Upload, Check, AlertCircle, Printer, Download, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [payPeriod, setPayPeriod] = useState<string>("")
  const [uploading, setUploading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [success, setSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [showAllData, setShowAllData] = useState<boolean>(false)
  const [showFullReport, setShowFullReport] = useState<boolean>(false)
  const [reportRef] = useState(useRef<HTMLDivElement>(null))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Por favor seleccione un archivo para subir")
      return
    }

    if (!payPeriod) {
      setError("Por favor seleccione un período de pago")
      return
    }

    // Simulate file upload with progress
    setUploading(true)
    setProgress(0)
    setError(null)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          setSuccess(true)
          setActiveTab("preview")
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const handlePrintPDF = () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Por favor permita ventanas emergentes para imprimir el informe")
      return
    }

    // Get the report content
    const reportContent = reportRef.current?.innerHTML || ""

    // Add styling for the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Informe de Pagos - Siclo</title>
          <style>
            body {
              font-family: 'DM Sans', sans-serif;
              line-height: 1.5;
              color: #333;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
            }
            h1 {
              font-size: 22px;
              margin: 10px 0;
            }
            .summary {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              flex-wrap: wrap;
            }
            .summary-item {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 10px;
              width: 45%;
            }
            .summary-label {
              font-weight: bold;
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f1f5f9;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .total {
              font-weight: bold;
              font-size: 18px;
              text-align: right;
              margin: 20px 0;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Siclo</div>
            <h1>Informe de Pagos a Instructores</h1>
            <p>Período: ${payPeriod === "dec-16-31-2024" ? "Dic 16-31, 2024" : "Dic 30-31, 2024"}</p>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Período de Pago:</div>
              <div>${payPeriod === "dec-16-31-2024" ? "Dic 16-31, 2024" : "Dic 30-31, 2024"}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total de Clases:</div>
              <div>35</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total de Instructores:</div>
              <div>14</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total de Reservaciones:</div>
              <div>1,134</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Instructor</th>
                <th>Clases</th>
                <th>Reservaciones</th>
                <th>Pago Base</th>
                <th>Bono</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dani Mua</td>
                <td>4</td>
                <td>184</td>
                <td>$80.00</td>
                <td>$92.00</td>
                <td>$172.00</td>
              </tr>
              <tr>
                <td>Hugo</td>
                <td>3</td>
                <td>129</td>
                <td>$60.00</td>
                <td>$64.50</td>
                <td>$124.50</td>
              </tr>
              <tr>
                <td>Isabella</td>
                <td>4</td>
                <td>114</td>
                <td>$80.00</td>
                <td>$57.00</td>
                <td>$137.00</td>
              </tr>
              <tr>
                <td>JP</td>
                <td>2</td>
                <td>71</td>
                <td>$40.00</td>
                <td>$35.50</td>
                <td>$75.50</td>
              </tr>
              <tr>
                <td>Caro</td>
                <td>3</td>
                <td>84</td>
                <td>$60.00</td>
                <td>$42.00</td>
                <td>$102.00</td>
              </tr>
              <tr>
                <td>Palo</td>
                <td>2</td>
                <td>38</td>
                <td>$40.00</td>
                <td>$19.00</td>
                <td>$59.00</td>
              </tr>
              <tr>
                <td>Fany</td>
                <td>2</td>
                <td>41</td>
                <td>$40.00</td>
                <td>$20.50</td>
                <td>$60.50</td>
              </tr>
              <tr>
                <td>Natu</td>
                <td>3</td>
                <td>125</td>
                <td>$60.00</td>
                <td>$62.50</td>
                <td>$122.50</td>
              </tr>
              <tr>
                <td>Sil</td>
                <td>3</td>
                <td>52</td>
                <td>$60.00</td>
                <td>$26.00</td>
                <td>$86.00</td>
              </tr>
              <tr>
                <td>Daniella R</td>
                <td>2</td>
                <td>60</td>
                <td>$40.00</td>
                <td>$30.00</td>
                <td>$70.00</td>
              </tr>
              <tr>
                <td>Adriana</td>
                <td>1</td>
                <td>20</td>
                <td>$20.00</td>
                <td>$10.00</td>
                <td>$30.00</td>
              </tr>
              <tr>
                <td>Fati</td>
                <td>1</td>
                <td>18</td>
                <td>$20.00</td>
                <td>$9.00</td>
                <td>$29.00</td>
              </tr>
              <tr>
                <td>Hosni</td>
                <td>1</td>
                <td>27</td>
                <td>$20.00</td>
                <td>$13.50</td>
                <td>$33.50</td>
              </tr>
              <tr>
                <td>Lorena</td>
                <td>1</td>
                <td>0</td>
                <td>$20.00</td>
                <td>$0.00</td>
                <td>$20.00</td>
              </tr>
            </tbody>
          </table>
          
          <div class="total">
            Total a Pagar: $1,121.50
          </div>
          
          <div class="footer">
            <p>Generado el ${new Date().toLocaleDateString("es-MX")} a las ${new Date().toLocaleTimeString("es-MX")}</p>
            <p>Sistema de Gestión de Instructores - Siclo</p>
          </div>
        </body>
      </html>
    `)

    // Close the document for writing and trigger print
    printWindow.document.close()
    printWindow.focus()

    // Delay printing slightly to ensure content is loaded
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const handleDownloadPDF = () => {
    // Alert the user that this would download a PDF in a real implementation
    alert("En un entorno de producción, esta función descargaría un PDF del informe de pagos.")
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Importar Datos de Clases</CardTitle>
        <CardDescription>Sube un archivo Excel con datos de clases para calcular pagos a instructores.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
            <TabsTrigger value="preview" disabled={!success}>
              Vista Previa
            </TabsTrigger>
            <TabsTrigger value="payment" disabled={!success}>
              Cálculo de Pagos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <form onSubmit={handleSubmit}>
              <div className="grid w-full gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="pay-period">Período de Pago</Label>
                  <Select value={payPeriod} onValueChange={setPayPeriod}>
                    <SelectTrigger id="pay-period">
                      <SelectValue placeholder="Seleccionar período de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dec-1-15-2024">Dic 1-15, 2024</SelectItem>
                      <SelectItem value="dec-16-31-2024">Dic 16-31, 2024</SelectItem>
                      <SelectItem value="jan-1-15-2025">Ene 1-15, 2025</SelectItem>
                      <SelectItem value="jan-16-31-2025">Ene 16-31, 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="file">Archivo Excel</Label>
                  <div className="flex items-center gap-4">
                    <Input id="file" type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
                    <div className="grid w-full gap-2">
                      <Label
                        htmlFor="file"
                        className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-background px-4 py-5 text-center"
                      >
                        <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                        <div className="mt-2 text-sm text-muted-foreground">
                          {file ? file.name : "Arrastra y suelta o haz clic para subir"}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">Solo archivos Excel (.xlsx, .xls)</div>
                      </Label>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {uploading && (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Subiendo...</Label>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {success && (
                  <Alert className="bg-primary/20 text-primary border-primary">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Éxito</AlertTitle>
                    <AlertDescription>
                      Archivo subido correctamente. Los datos están listos para revisión.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <CardFooter className="flex justify-end px-0 pt-6">
                <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
                  {uploading ? (
                    <>Procesando...</>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir y Procesar
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="preview">
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-foreground">Vista Previa de Datos</h3>
                <Button variant="outline" size="sm" onClick={() => setShowAllData(!showAllData)}>
                  {showAllData ? "Mostrar Menos" : "Mostrar Todos"}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        Estudio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        Instructor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        Reservaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">914968</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Reducto</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Dani Mua</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">46</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">914973</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Primavera</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Hugo</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">50</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">914969</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Reducto</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Dani Mua</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">50</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">914974</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Primavera</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Hugo</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">50</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">915521</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Asia</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Caro</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">20</td>
                    </tr>
                    {showAllData && (
                      <>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">914975</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Sí San Isidro</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Isabella</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">29</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">914972</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Reducto</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Palo</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">21</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">914799</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Sí San Isidro</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Fany</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">21</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">914970</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Reducto</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">JP</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">34</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">915523</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Asia</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Caro</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">44</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">915517</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Asia</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Sil</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">17</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">914976</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Sí San Isidro</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Isabella</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">915127</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Sí San Isidro</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Fany</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">22</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">915513</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Asia</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Daniella R</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">42</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">915522</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">30/12/2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Síclo Asia</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Caro</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">21</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-foreground">
                {showAllData ? (
                  "Mostrando todos los registros."
                ) : (
                  <>
                    Mostrando 5 de 35 registros.{" "}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setShowAllData(true)}>
                      Ver todos
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setActiveTab("payment")}>Continuar al Cálculo de Pagos</Button>
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-foreground">Cálculo de Pagos</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFullReport(!showFullReport)}>
                    {showFullReport ? "Mostrar Menos" : "Mostrar Todos"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrintPDF} className="flex items-center">
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    Descargar PDF
                  </Button>
                </div>
              </div>

              <div ref={reportRef}>
                <div className="grid gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Período de Pago:</span>
                    <span className="text-foreground">Dic 16-31, 2024</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Total de Clases:</span>
                    <span className="text-foreground">35</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Total de Instructores:</span>
                    <span className="text-foreground">14</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Total de Reservaciones:</span>
                    <span className="text-foreground">1,134</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Instructor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Clases
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Reservaciones
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Pago Base
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Bono
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Dani Mua</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">4</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">184</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$80.00</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$92.00</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$172.00</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Hugo</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">3</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">129</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$60.00</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$64.50</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$124.50</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Isabella</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">4</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">114</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$80.00</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$57.00</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$137.00</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">JP</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">2</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">71</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$40.00</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$35.50</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$75.50</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Caro</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">3</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">84</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$60.00</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$42.00</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$102.00</td>
                      </tr>
                      {showFullReport && (
                        <>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Palo</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">2</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">38</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$40.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$19.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$59.00</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Fany</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">2</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">41</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$40.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$20.50</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$60.50</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Natu</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">3</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">125</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$60.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$62.50</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$122.50</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Sil</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">3</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">52</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$60.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$26.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$86.00</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Daniella R</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">2</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">60</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$40.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$30.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$70.00</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Adriana</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">1</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">20</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$20.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$10.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$30.00</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Fati</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">1</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">18</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$20.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$9.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$29.00</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Hosni</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">1</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">27</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$20.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$13.50</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$33.50</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Lorena</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">1</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">0</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$20.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">$0.00</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">$20.00</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-right font-medium text-lg text-foreground">Total a Pagar: $1,121.50</div>

                {!showFullReport && (
                  <div className="mt-4 text-sm text-foreground">
                    Mostrando 5 de 14 instructores.{" "}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setShowFullReport(true)}>
                      Ver todos
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setActiveTab("preview")}>
                Volver a Vista Previa
              </Button>
              <Button onClick={handlePrintPDF} className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Generar Informe de Pagos
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

