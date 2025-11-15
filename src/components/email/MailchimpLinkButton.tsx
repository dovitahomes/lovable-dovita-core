import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useEmailConfig } from "@/hooks/useEmailConfig";

interface MailchimpLinkButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function MailchimpLinkButton({ variant = "outline", size = "sm", className }: MailchimpLinkButtonProps) {
  const { config, isLoading } = useEmailConfig();

  if (isLoading || !config || config.proveedor !== 'mailchimp' || !config.mailchimp_server_prefix) {
    return null;
  }

  const mailchimpUrl = `https://${config.mailchimp_server_prefix}.admin.mailchimp.com/`;

  const handleOpenMailchimp = () => {
    window.open(mailchimpUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleOpenMailchimp}
      className={className}
    >
      <ExternalLink className="mr-2 h-4 w-4" />
      Abrir Mailchimp
    </Button>
  );
}
