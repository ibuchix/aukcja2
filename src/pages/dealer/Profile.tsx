import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@supabase/supabase-js";
import { Profile as UserIcon, Building2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { profileFormSchema, DealerProfileFormValues } from "@/schemas/profileFormSchema";
import { useAuth } from "@/contexts/AuthContext";
import { isValidRecord } from "@/utils/supabaseHelpers";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<DealerProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      dealershipName: "",
      supervisorName: "",
      taxId: "",
      businessRegistryNumber: "",
      address: "",
      licenseNumber: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("dealers")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile(data);
          form.reset({
            dealershipName: data.dealership_name || "",
            supervisorName: data.supervisor_name || "",
            taxId: data.tax_id || "",
            businessRegistryNumber: data.business_registry_number || "",
            address: data.address || "",
            licenseNumber: data.license_number || "",
          });
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchProfile();
  }, [user, toast, form]);

  const updateProfile = async (values: DealerProfileFormValues) => {
    setSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('dealers')
        .update({
          dealership_name: values.dealershipName,
          supervisor_name: values.supervisorName,
          tax_id: values.taxId,
          business_registry_number: values.businessRegistryNumber,
          address: values.address,
          license_number: values.licenseNumber,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (isValidRecord(data)) {
        setProfile(data);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        throw new Error("Invalid data returned from update operation");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center">
            <UserIcon className="mr-2 h-5 w-5" />
            Dealer Profile
          </CardTitle>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </CardHeader>
        <CardDescription>
          Manage your dealer profile information here.
        </CardDescription>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(updateProfile)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField
                    control={form.control}
                    name="dealershipName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dealership Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter dealership name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="supervisorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supervisor Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter supervisor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tax ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="businessRegistryNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Registry Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter business registry number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter license number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
