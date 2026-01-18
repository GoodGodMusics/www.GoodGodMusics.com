import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean']
  ]
};

export default function DevotionalSubmissionForm() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    bible_reference: '',
    reflection_prompt: ''
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {}
    };
    getUser();
  }, []);

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.UserDevotional.create({
      ...data,
      author_email: currentUser.email,
      author_name: currentUser.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userDevotionals'] });
      setFormData({ title: '', content: '', bible_reference: '', reflection_prompt: '' });
      alert('Thank you! Your devotional has been submitted for review.');
    },
    onError: () => {
      alert('Failed to submit. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please log in to submit devotionals');
      return;
    }
    submitMutation.mutate(formData);
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          Submit Your Bible Devotional
        </CardTitle>
        <p className="text-sm text-stone-600">
          Share your reflections and insights with the community
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Devotional Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Finding Peace in Troubled Times"
              required
            />
          </div>

          <div>
            <Label>Bible Reference *</Label>
            <Input
              value={formData.bible_reference}
              onChange={(e) => setFormData({ ...formData, bible_reference: e.target.value })}
              placeholder="Psalm 23:1-6"
              required
            />
          </div>

          <div>
            <Label>Devotional Content *</Label>
            <div className="bg-white rounded-lg">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                modules={quillModules}
                placeholder="Write your devotional here..."
              />
            </div>
          </div>

          <div>
            <Label>Reflection Question</Label>
            <Input
              value={formData.reflection_prompt}
              onChange={(e) => setFormData({ ...formData, reflection_prompt: e.target.value })}
              placeholder="How can you apply this in your life today?"
            />
          </div>

          <Button
            type="submit"
            disabled={submitMutation.isPending || !currentUser}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Devotional
              </>
            )}
          </Button>
          {!currentUser && (
            <p className="text-sm text-center text-red-600">Please log in to submit devotionals</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}