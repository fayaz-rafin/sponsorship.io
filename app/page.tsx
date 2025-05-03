"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Sparkles, Edit, RotateCcw } from "lucide-react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function EmailDrafter() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    recipientCompany: "",
    emailContent: "",
    emailTone: "professional",
    emailPurpose: "",
  })
  const [generatedEmail, setGeneratedEmail] = useState("")
  const [followUpPrompt, setFollowUpPrompt] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleToneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, emailTone: value }))
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const generateEmail = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientName: formData.recipientName,
          recipientEmail: formData.recipientEmail,
          recipientCompany: formData.recipientCompany,
          emailPurpose: formData.emailPurpose,
          emailContent: formData.emailContent,
          emailTone: formData.emailTone,
          previousEmail: generatedEmail,
          followUpPrompt: followUpPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate email")
      }

      const data = await response.json()
      setGeneratedEmail(data.email)
      setFollowUpPrompt("")
      setStep(3)
    } catch (error) {
      console.error("Error generating email:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowUp = async () => {
    if (!followUpPrompt.trim()) return
    await generateEmail()
  }

  const handleReset = () => {
    setFormData({
      recipientName: "",
      recipientEmail: "",
      recipientCompany: "",
      emailContent: "",
      emailTone: "professional",
      emailPurpose: "",
    })
    setGeneratedEmail("")
    setFollowUpPrompt("")
    setStep(1)
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Email Drafting Assistant</h1>

      <Tabs defaultValue="compose" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="compose">Compose Email</TabsTrigger>
          <TabsTrigger value="history" disabled>
            Email History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <div className="space-y-8">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recipient Information</CardTitle>
                  <CardDescription>Enter the details of the person you're sending this email to.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient's Name</Label>
                    <Input
                      id="recipientName"
                      name="recipientName"
                      placeholder="John Doe"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Recipient's Email</Label>
                    <Input
                      id="recipientEmail"
                      name="recipientEmail"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={formData.recipientEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientCompany">Recipient's Company</Label>
                    <Input
                      id="recipientCompany"
                      name="recipientCompany"
                      placeholder="Acme Corporation"
                      value={formData.recipientCompany}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailContent">What do you want to tell in this email?</Label>
                    <Textarea
                      id="emailContent"
                      name="emailContent"
                      placeholder="I want to discuss our recent project, ask about the timeline, and propose a meeting..."
                      className="min-h-[100px]"
                      value={formData.emailContent}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Tone</Label>
                    <RadioGroup
                      value={formData.emailTone}
                      onValueChange={handleToneChange}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="formal" id="formal" />
                        <Label htmlFor="formal" className="cursor-pointer">
                          Formal
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="professional" id="professional" />
                        <Label htmlFor="professional" className="cursor-pointer">
                          Professional
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="friendly" id="friendly" />
                        <Label htmlFor="friendly" className="cursor-pointer">
                          Friendly
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="casual" id="casual" />
                        <Label htmlFor="casual" className="cursor-pointer">
                          Casual
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={handleNext}
                    disabled={
                      !formData.recipientName ||
                      !formData.recipientEmail ||
                      !formData.recipientCompany ||
                      !formData.emailContent
                    }
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Purpose</CardTitle>
                  <CardDescription>Describe the general purpose of your email.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailPurpose">What is the purpose of this email?</Label>
                    <Textarea
                      id="emailPurpose"
                      name="emailPurpose"
                      placeholder="Follow up on a meeting, job application, sales inquiry..."
                      className="min-h-[150px]"
                      value={formData.emailPurpose}
                      onChange={handleInputChange}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button onClick={generateEmail} disabled={!formData.emailPurpose || loading}>
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Draft Email
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 3 && generatedEmail && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Email</CardTitle>
                    <CardDescription>
                      Here's your AI-generated email draft. You can edit it or request changes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">{generatedEmail}</div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Start Over
                    </Button>
                    <Button variant="default">
                      <Send className="mr-2 h-4 w-4" />
                      Copy to Clipboard
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Refine Your Email</CardTitle>
                    <CardDescription>
                      Not quite right? Provide additional instructions to refine the email.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="followUpPrompt">Follow-up Instructions</Label>
                      <Textarea
                        id="followUpPrompt"
                        placeholder="Make it more formal, add a section about the budget, etc."
                        className="min-h-[100px]"
                        value={followUpPrompt}
                        onChange={(e) => setFollowUpPrompt(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleFollowUp} disabled={!followUpPrompt.trim() || loading}>
                      {loading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Updating...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" />
                          Update Email
                        </span>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
