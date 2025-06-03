import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ActionButtonsProps {
  submissionId: string;
  onApprove?: (submissionId: string) => void;
  onReject?: (submissionId: string, remarks: string) => void;
  onAddComment?: (submissionId: string, comment: string) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  submissionId,
  onApprove,
  onReject,
  onAddComment,
}) => {
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [comment, setComment] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleReject = () => {
    if (rejectRemarks.trim()) {
      onReject?.(submissionId, rejectRemarks);
      setRejectRemarks('');
      setShowRejectForm(false);
    }
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      onAddComment?.(submissionId, comment);
      setComment('');
      setShowCommentForm(false);
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex space-x-4">
        <Button onClick={() => onApprove?.(submissionId)}>
          ✅ Approve
        </Button>
        
        <Button
          variant="destructive"
          onClick={() => {
            setShowRejectForm((prev) => {
              if (!prev) setShowCommentForm(false);
              return !prev;
            });
          }}
        >
          ❌ Reject
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => {
            setShowCommentForm((prev) => {
              if (!prev) setShowRejectForm(false);
              return !prev;
            });
          }}
        >
          💬 Add Comment
        </Button>
      </div>

      {/* Reject Form */}
      {showRejectForm && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 max-h-80 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-remarks" className="text-red-800">
                Rejection Remarks
              </Label>
              <Textarea
                id="reject-remarks"
                placeholder="Please provide a reason for rejection..."
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                className="mt-2 max-h-32 overflow-y-auto resize-y"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectRemarks.trim()}
              >
                Reject Submission
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Form */}
      {showCommentForm && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-h-80 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment" className="text-blue-800">
                Add Comment
              </Label>
              <Textarea
                id="comment"
                placeholder="Enter your comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-2 max-h-32 overflow-y-auto resize-y"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCommentForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddComment}
                disabled={!comment.trim()}
              >
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;