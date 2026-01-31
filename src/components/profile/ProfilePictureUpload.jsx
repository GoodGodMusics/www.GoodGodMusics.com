import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, User, Loader2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePictureUpload({ user }) {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      await updateUserMutation.mutateAsync({ profile_picture: response.file_url });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Picture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-xl">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-stone-600 mb-3">
              Upload a profile picture to personalize your account
            </p>
            <label htmlFor="profile-picture-upload">
              <input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button
                asChild
                disabled={uploading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <span className="cursor-pointer">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : user?.profile_picture ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Change Picture
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Picture
                    </>
                  )}
                </span>
              </Button>
            </label>
            <p className="text-xs text-stone-500 mt-2">
              Max size: 5MB • Formats: JPG, PNG, GIF
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}