import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SUPPORT_EMAIL = "support@robinzone.ai";

const formSchema = z.object({
  paymentEmail: z
    .string()
    .trim()
    .min(1, { message: "Payment email is required" })
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  fullName: z
    .string()
    .trim()
    .min(1, { message: "Full name is required" })
    .max(200, { message: "Name must be less than 200 characters" }),
  message: z
    .string()
    .trim()
    .max(1000, { message: "Message must be less than 1000 characters" })
    .optional(),
});

type CancelFormValues = z.infer<typeof formSchema>;

export const Route = createFileRoute("/cancel-subscription")({
  head: () => ({
    meta: [
      { title: "Cancel Subscription · Robinzone" },
      {
        name: "description",
        content:
          "Request to cancel your Robinzone subscription. Provide the email you used for payment and our support team will assist you.",
      },
      { property: "og:title", content: "Cancel Subscription · Robinzone" },
      {
        property: "og:description",
        content:
          "Request to cancel your Robinzone subscription. Our support team will confirm via email.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CancelSubscriptionPage,
});

function CancelSubscriptionPage() {
  const form = useForm<CancelFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentEmail: "",
      fullName: "",
      message: "",
    },
  });

  const onSubmit = (values: CancelFormValues) => {
    const subject = `Cancel Subscription Request - ${values.fullName}`;
    const body = [
      "Cancel Subscription Request",
      "",
      `Payment Email: ${values.paymentEmail}`,
      `Customer Name: ${values.fullName}`,
      "",
      "Please cancel my subscription effective immediately.",
      "",
      values.message ? `Additional message:\n${values.message}` : "",
    ].join("\n");

    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;
  };

  return (
    <main className="pb-16 pt-6 sm:pt-10">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="mb-10 text-center">
            <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Cancel Subscription
            </h1>
            <p className="mx-auto max-w-lg text-[15px] text-[color:var(--text-secondary)]">
              To cancel your subscription, please enter the email you used for
              payment. Our support team will process your request and confirm
              via{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>

          <Card
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Mail className="h-5 w-5 text-primary" />
                Cancel Subscription Form
              </CardTitle>
              <CardDescription>
                Fill out the form below to request cancellation of your
                subscription.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="paymentEmail"
                    render={({ field }) => (
                      <FormItem className="space-y-3.5">
                        <FormLabel className="block">Payment Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The email address used when making the purchase.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="space-y-3.5">
                        <FormLabel className="block">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormDescription>
                          Name and surname of the customer who purchased the
                          subscription.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="space-y-3.5">
                        <FormLabel className="block">Additional Message (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional details about your cancellation request..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional context to help us process your request
                          faster.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                    Cancel Subscription
                  </Button>

                  <p className="text-center text-xs text-[color:var(--text-secondary)]">
                    By submitting this form, you will open your default email
                    app with a pre-filled message to{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>
      </div>
    </main>
  );
}