'use client'
import { useRouter } from 'next/navigation';
import { InvitationList, InviteMember } from './InvitationList';

interface InviteEmployeeComponentProps {
  employee: {
    id: string;
    email: string;
    // Add other necessary employee fields
  };
  orgId: string;
}

const InviteEmployeeComponent: React.FC<InviteEmployeeComponentProps> = ({
  employee,
  orgId,
}) => {
  const router = useRouter();

  return (
    <div>
      <h3 className="text-white">Invite Employee to Clerk</h3>
      <InviteMember id={employee.id} />
      <h3 className="text-white">Invitation List</h3>
      <InvitationList id={employee.id} />
    </div>
  );
};

export default InviteEmployeeComponent;
