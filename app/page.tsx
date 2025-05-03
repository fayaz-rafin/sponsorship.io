"use client" // Indicates this is a Client Component in Next.js 13+

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Sparkles, Edit, RotateCcw, Copy } from "lucide-react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// Assuming EmailHistory component exists and works
import { EmailHistory } from "@/components/email-history"
import { useToast } from "@/components/ui/use-toast" // Assuming you have a toast component/hook
// Import the animated text hook
import { useAnimatedText } from "@/components/ui/animated-text";
// Import the GridPattern component and cn utility
import { GridPattern } from "@/components/ui/grid-pattern";
// Assuming cn utility is at this path
import { cn } from "@/lib/utils";


export default function EmailDrafter() {
  const { toast } = useToast(); // Initialize toast

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    recipientCompany: "",
    recipientPosition: "", // Frontend collects this, backend ignores it for now
    emailTone: "professional",
    emailPurpose: "",
    emailContent: "", // Added state for the core content
  })
  const [generatedEmail, setGeneratedEmail] = useState("")
  const [followUpPrompt, setFollowUpPrompt] = useState("")
  const [error, setError] = useState<string | null>(null); // State to show API errors

  // --- Animation State ---
  const [isAnimatingEmail, setIsAnimatingEmail] = useState(false);
  // You can adjust the delay here. "" means character by character, 10 is a delay in ms.
  const animationDelayMs = 10;
  // Use the hook: pass true/false to control play, the text to animate, and the separator/delay
  const animatedEmailText = useAnimatedText(
    isAnimatingEmail ? generatedEmail : "", // Animate only when isAnimatingEmail is true
    "", // Separator: "" for character-by-character animation
    animationDelayMs // Delay per character/chunk
  );
  // --- End Animation State ---


  // Function to call the API - used for both initial and follow-up
  const callGenerateApi = useCallback(async () => {
     setLoading(true);
     setError(null); // Clear previous errors
     setIsAnimatingEmail(false); // Stop any ongoing animation before a new call
     setGeneratedEmail(""); // Clear previous email content immediately

     try {
        const payload = {
            recipientName: formData.recipientName,
            recipientEmail: formData.recipientEmail,
            recipientCompany: formData.recipientCompany,
            // recipientPosition: formData.recipientPosition, // Backend doesn't use this in current prompt
            emailTone: formData.emailTone,
            emailPurpose: formData.emailPurpose,
            // Include emailContent for initial generation
            emailContent: formData.emailContent,

            // Include previousEmail and followUpPrompt for follow-up
            // These will be empty strings for the initial call, which is fine
            // When follow-up, generatedEmail state holds the previous email
            previousEmail: generatedEmail,
            followUpPrompt: followUpPrompt,
        };

       const response = await fetch("/api/generate-email", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify(payload),
       })

       // Added more robust error handling
       if (!response.ok) {
         const errorData = await response.json().catch(() => null); // Try parsing error body
         const errorMessage = errorData?.error || response.statusText || `API Error: ${response.status}`;
         console.error("API Error:", response.status, errorData);
         throw new Error(errorMessage);
       }

       const data = await response.json()

       if (data.email) {
         setGeneratedEmail(data.email); // Set the full generated email
         setFollowUpPrompt(""); // Clear follow-up prompt after successful update/generation
         setStep(3); // Move to step 3 to display the email
         // --- Trigger Animation ---
         setIsAnimatingEmail(true); // Start the animation after setting the email
         // --- End Trigger Animation ---
       } else {
         // Handle cases where API call is OK but returns no email text (e.g., safety block)
         console.warn("API returned success but no email text:", data);
         setGeneratedEmail(""); // Ensure state is empty
         setError("AI did not generate email text. This might be due to safety filters or unclear instructions. Please try again or modify your request.");
         // Move to step 3 to show the "Generation Unsuccessful" message
         setStep(3);
       }

     } catch (err: any) {
       console.error("Error generating email:", err);
       setError(err.message || "An unexpected error occurred during generation.");
       setGeneratedEmail(""); // Clear any previous generated email on error
       setStep(2); // Go back to step 2 to allow user to edit input after error
     } finally {
       setLoading(false);
     }
  }, [formData, generatedEmail, followUpPrompt, setLoading, setError, setIsAnimatingEmail, setGeneratedEmail, setStep]); // Add all state setters and states it depends on as dependencies.


  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, []); // Memoize handler

  const handleToneChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, emailTone: value }))
  }, []); // Memoize handler

  const handleNext = useCallback(async () => { // Make it async as it calls an async function
    setError(null); // Clear errors on navigation
    if (step < 2) { // Go from step 1 to step 2 (Recipient -> Purpose/Content)
      setStep(step + 1);
    } else if (step === 2) { // Go from step 2 to step 3 (Purpose/Content -> Generate/Review)
       await callGenerateApi(); // Call the API when moving from step 2 to 3
    }
  }, [step, callGenerateApi]); // Include callGenerateApi in dependencies


  const handleBack = useCallback(() => {
    setError(null); // Clear errors on navigation
    if (step > 1) {
      setStep(step - 1)
    }
  }, [step]); // Added step as dependency


  const handleFollowUp = useCallback(async () => {
    if (!followUpPrompt.trim() || loading) return; // Prevent multiple clicks / empty prompt
    await callGenerateApi(); // Call the API with current generated email and follow-up prompt
  }, [followUpPrompt, loading, callGenerateApi]); // Include dependencies

  // --- Handle Replay Animation ---
  const handleReplayAnimation = useCallback(() => {
      setIsAnimatingEmail(false); // Stop animation
      // Use setTimeout to yield control back to the event loop briefly,
      // allowing the hook to reset, then start it again.
      setTimeout(() => {
          setIsAnimatingEmail(true); // Start animation
      }, 10); // A small delay ensures state update is processed
  }, [setIsAnimatingEmail]); // Dependency on the setter

  // --- End Handle Replay Animation ---


  const handleReset = useCallback(() => {
    setError(null);
    setFormData({
      recipientName: "",
      recipientEmail: "",
      recipientCompany: "",
      recipientPosition: "",
      emailTone: "professional",
      emailPurpose: "",
      emailContent: "", // Reset content too
    })
    setGeneratedEmail("") // Clear generated email
    setFollowUpPrompt("") // Clear follow-up prompt
    setIsAnimatingEmail(false); // Stop animation on reset
    setStep(1) // Go back to step 1
  }, [setIsAnimatingEmail, setGeneratedEmail, setFollowUpPrompt, setStep, setFormData, setError]); // Include all state setters


  const copyToClipboard = useCallback(() => {
      if (generatedEmail) {
          navigator.clipboard.writeText(generatedEmail).then(() => {
              toast({
                  title: "Copied!",
                  description: "Email copied to clipboard.",
                  duration: 2000,
              });
          }).catch(err => {
              console.error("Failed to copy email:", err);
              toast({
                  title: "Copy Failed",
                  description: "Could not copy email to clipboard.",
                  variant: "destructive",
                  duration: 3000,
              });
          });
      }
  }, [generatedEmail, toast]); // Include generatedEmail and toast as dependencies


  return (
    // Add 'relative' class to the main container for GridPattern absolute positioning
    // Add 'overflow-hidden' in case the grid pattern extends slightly outside
    <div className={cn("container mx-auto py-10 px-4 max-w-4xl relative overflow-hidden")}>
      {/* Add the GridPattern component here, BEFORE the main content */}
      {/* Choose a style based on your preference (like the linear gradient or simple radial) */}
      <GridPattern
        width={30} // Adjust grid size as needed
        height={30} // Adjust grid size as needed
        x={-1} // Keep default pattern offset
        y={-1} // Keep default pattern offset
        // Example mask: radial gradient fading from center
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30", // Default styles from component
          "[mask-image:radial-gradient(ellipse_at_center,white,transparent_60%)]" // Apply mask
          // Example mask: linear gradient fading bottom right
          // "[mask-image:linear-gradient(to_bottom_right,white_20%,transparent_80%)]"
        )}
      />

      {/* Main content sits ON TOP of the grid */}
      {/* Add z-10 or similar if content is behind grid, but default stacking context should be fine */}
      <h1 className="text-3xl font-bold text-center mb-8 z-10 relative">Email Drafting Assistant</h1>

      {/* Display API Errors */}
      {error && (
          // Error div might need z-index if it's behind grid
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 z-10" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
          </div>
      )}

      <Tabs defaultValue="compose" className="w-full z-10 relative"> {/* Tabs might need z-index */}
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="compose">Compose Email</TabsTrigger>
          <TabsTrigger value="history">
            Email History {/* This tab content is handled by EmailHistory component */}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <div className="space-y-8">
            {/* Step 1: Recipient Information */}
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
                    <Label htmlFor="recipientPosition">Recipient's Position (Optional)</Label> {/* Made optional */}
                    <Input
                      id="recipientPosition"
                      name="recipientPosition"
                      placeholder="e.g. Software Engineer, Marketing Manager, CEO"
                      value={formData.recipientPosition}
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
                    onClick={handleNext} // Move to Step 2
                    disabled={
                      !formData.recipientName ||
                      !formData.recipientEmail ||
                      !formData.recipientCompany
                      // Recipient position is now optional for step 1
                    }
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 2: Email Purpose and Content */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Details</CardTitle>
                  <CardDescription>Describe the email's purpose and the key information to include.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="emailPurpose">Purpose of this email</Label>
                    <Textarea
                      id="emailPurpose"
                      name="emailPurpose"
                      placeholder="e.g. Follow up on a meeting, inquire about a job posting, request a quote..."
                      className="min-h-[100px]" // Slightly smaller height
                      value={formData.emailPurpose}
                      onChange={handleInputChange}
                    />
                  </div>
                  {/* INPUT FIELD for emailContent */}
                  <div className="space-y-2">
                    <Label htmlFor="emailContent">Key Information to Include</Label>
                    <Textarea
                      id="emailContent"
                      name="emailContent"
                      placeholder="e.g. Mention the date of our meeting, reference the job ID ABC, details about the product features..."
                      className="min-h-[150px]" // Keep original height for main content
                      value={formData.emailContent}
                      onChange={handleInputChange}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  {/* This button now triggers the API call via handleNext */}
                  <Button onClick={handleNext} disabled={!formData.emailPurpose.trim() || !formData.emailContent.trim() || loading}>
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

            {/* Step 3: Display Generated Email or Error */}
            {step === 3 && (
               <div className="space-y-6">
                 {/* Display the generated email if available */}
                 {/* Now uses animatedEmailText */}
                 {generatedEmail ? (
                   <Card>
                     <CardHeader>
                       <CardTitle>Generated Email</CardTitle>
                       <CardDescription>
                         Here's your AI-generated email draft. You can edit it or request changes.
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       {/* Use a textarea for easy copying/selection, make it read-only */}
                       {/* Display the animated text */}
                       <Textarea
                           className="min-h-[300px] bg-muted p-4 rounded-md whitespace-pre-wrap font-mono text-sm"
                           value={animatedEmailText} // Use the animated text here
                           readOnly
                           style={{ cursor: 'text' }} // Indicate it's selectable text
                       />
                     </CardContent>
                     <CardFooter className="flex justify-between">
                       <Button variant="outline" onClick={handleReset}>
                         <RotateCcw className="mr-2 h-4 w-4" />
                         Start Over
                       </Button>
                       <div className="flex space-x-2"> {/* Group copy and replay buttons */}
                           {/* Replay Animation Button */}
                           <Button
                             variant="outline"
                             size="icon"
                             onClick={handleReplayAnimation}
                             // Disable replay while loading or if no email is generated
                             disabled={loading || !generatedEmail}
                           >
                             <RotateCcw className="h-4 w-4" />
                           </Button>
                           {/* Copy Button */}
                           <Button variant="default" onClick={copyToClipboard} disabled={!generatedEmail}>
                             <Copy className="mr-2 h-4 w-4" />
                             Copy
                           </Button>
                       </div>
                     </CardFooter>
                   </Card>
                 ) : (
                   // Display an error/info message if no email was generated after reaching step 3
                   <Card>
                      <CardHeader>
                         <CardTitle>Generation Unsuccessful</CardTitle>
                         <CardDescription>
                             The AI was unable to generate an email draft based on your request. This can happen if the request is unclear, sensitive, or if there was an internal issue.
                             {error && <span className="text-red-600 block mt-2">Error details: {error}</span>}
                         </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex justify-between">
                          <Button variant="outline" onClick={() => setStep(2)}> {/* Go back to edit purpose/content */}
                              Back to Details
                          </Button>
                          <Button variant="outline" onClick={handleReset}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Start Over
                          </Button>
                      </CardFooter>
                   </Card>
                 )}


                 {/* Refine section only shows if an email WAS generated */}
                 {generatedEmail && (
                   <Card>
                     <CardHeader>
                       <CardTitle>Refine Your Email</CardTitle>
                       <CardDescription>
                         Not quite right? Provide additional instructions to refine the email draft.
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-2">
                         <Label htmlFor="followUpPrompt">Follow-up Instructions</Label>
                         <Textarea
                           id="followUpPrompt"
                           placeholder="Make it more formal, add a section about the budget, shorten it..."
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
                 )}
               </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          {/* Assuming EmailHistory component is implemented separately */}
          {/* You might want to pass generatedEmail to EmailHistory to save it */}
           <EmailHistory latestEmail={generatedEmail} onSave={() => setGeneratedEmail('') /* Optionally clear after saving */} />
        </TabsContent>
      </Tabs>
    </div>
  )
}