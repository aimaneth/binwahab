import { ReturnStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

interface ReturnStatusBadgeProps {
  status: ReturnStatus
}

export function ReturnStatusBadge({ status }: ReturnStatusBadgeProps) {
  const getStatusColor = (status: ReturnStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "APPROVED":
        return "bg-green-500 hover:bg-green-600"
      case "REJECTED":
        return "bg-red-500 hover:bg-red-600"
      case "COMPLETED":
        return "bg-blue-500 hover:bg-blue-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  return (
    <Badge className={getStatusColor(status)}>
      {status}
    </Badge>
  )
} 