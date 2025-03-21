import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signInSchema, type SignInCredentials } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { AtSign, LockKeyhole } from "lucide-react";

interface SignInFormProps {
  onSubmit: (values: SignInCredentials) => Promise<boolean>;
  onToggleForm: () => void;
  isSubmitting: boolean;
}

export function SignInForm({ onSubmit, onToggleForm, isSubmitting }: SignInFormProps) {
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<SignInCredentials>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  const handleSubmit = async (values: SignInCredentials) => {
    setError(null);
    try {
      const success = await onSubmit(values);
      if (!success) {
        setError("Invalid username/email or password");
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
        <CardTitle className="text-2xl font-bold text-center">WhatsClone</CardTitle>
        <CardDescription className="text-center">
          Enter your email or username to sign in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="you@example.com or username" 
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
                        placeholder="••••••••" 
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
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button 
          variant="outline" 
          onClick={onToggleForm}
          className="w-full border-primary/20 hover:bg-primary/5"
        >
          Don't have an account? Create one
        </Button>
      </CardFooter>
    </Card>
  );
}