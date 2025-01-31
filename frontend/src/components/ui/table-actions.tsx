import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function TableActions({
  onView,
  onEdit,
  onDelete,
  className
}: TableActionsProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {onView && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onView}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
