import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { insertUserSchema } from "@shared/schema";
import { AtSign, User, LockKeyhole, ShieldCheck } from "lucide-react";

// Extend the insert schema with password confirmation
const signUpSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  email: z.string().email("Invalid email address"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSubmit: (values: SignUpFormValues) => Promise<boolean>;
  onToggleForm: () => void;
  isSubmitting: boolean;
}

export function SignUpForm({ onSubmit, onToggleForm, isSubmitting }: SignUpFormProps) {
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: ""
    }
  });
  
  const handleSubmit = async (values: SignUpFormValues) => {
    setError(null);
    try {
      const success = await onSubmit(values);
      if (!success) {
        setError("Email or username already exists");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto border-none shadow-lg dark:bg-[#111B21] dark:text-gray-100">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Sign up to start chatting with your friends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        className="pl-10"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="Choose a username" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        type="password" 
                        placeholder="Create a password" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        type="password" 
                        placeholder="Confirm your password" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="text-sm font-medium text-destructive">{error}</div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          variant="link" 
          onClick={onToggleForm}
          className="text-primary hover:text-primary/80"
        >
          Already have an account? Sign in
        </Button>
      </CardFooter>
    </Card>
  );
}