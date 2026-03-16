"use client";


import React, { useState } from 'react';
import { X, Check, Copy, Shield, AlertTriangle } from 'lucide-react';

interface FirebaseTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const FirebaseTutorial: React.FC<FirebaseTutorialProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }
    function isAdmin() { return isAuthenticated() && ((exists(/databases/$(database)/documents/users/$(request.auth.uid)) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.username == 'gabrielamaro') || request.auth.token.email == 'gabrielamaro@live.com'); }

    match /system_notifications/{notifId} { allow read: if true; allow write: if isAdmin(); }
    match /project_changes/{changeId} { allow read: if isAdmin(); allow write: if isAdmin(); }
    match /system_features/{featureId} { allow read: if isAdmin(); allow write: if isAdmin(); }
    match /settings/{document=**} { allow read: if true; allow write: if isAdmin(); }
    match /system_logs/{logId} { allow create: if true; allow read: if isAdmin(); }
    
    match /support_tickets/{ticketId} { allow create: if isAuthenticated(); allow read: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid); allow update: if isAdmin(); }
    match /report_tickets/{ticketId} { allow create: if isAuthenticated(); allow read, update: if isAdmin(); }

    match /bible_chapters/{chapterId} { allow read: if true; allow write: if isAuthenticated(); }
    match /daily_devotionals/{dateId} { allow read: if true; allow write: if isAuthenticated(); }
    match /quiz_questions/{questionId} { allow read: if true; allow write: if isAuthenticated(); }

    match /public_studies/{studyId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
    }

    match /custom_plans/{planId} {
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() && (resource.data.authorId == request.auth.uid || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['subscribersCount', 'teamScores']) || isAdmin());
      allow delete: if isAuthenticated() && (resource.data.authorId == request.auth.uid || isAdmin());
      allow read: if isAuthenticated();
      
      match /participants/{participantId} {
         allow read: if isAuthenticated();
         allow write: if isAuthenticated() && (request.auth.uid == participantId || get(/databases/$(database)/documents/custom_plans/$(planId)).data.authorId == request.auth.uid || isAdmin());
      }
    }
    
    match /custom_quizzes/{quizId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.authorId == request.auth.uid;
    }

    match /reading_tracks/{trackId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (resource.data.authorId == request.auth.uid || isAdmin());
    }

    match /guided_prayers/{prayerId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (resource.data.authorId == request.auth.uid || isAdmin());
    }
    
    match /evaluations/{evalId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.authorId == request.auth.uid;
      allow delete: if isAuthenticated() && (resource.data.authorId == request.auth.uid || isAdmin());
    }

    match /users/{userId} {
      allow get: if true; allow list: if true;
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || (isAuthenticated() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['followersCount', 'followingCount']));
      
      match /notes/{noteId} { allow read, write: if isOwner(userId); }
      match /studies/{studyId} { allow read: if true; allow write: if isOwner(userId); }
      match /study_modules/{moduleId} { allow read, write: if isOwner(userId); }
      match /saved_posts/{postId} { allow read, write: if isOwner(userId); }
      match /daily_routines/{routineId} { allow read, write: if isOwner(userId); }
      match /notifications/{notifId} { allow read, write: if isOwner(userId); }
      
      match /teams/{teamId} { 
        allow read: if isOwner(userId);
        allow create: if isOwner(userId);
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }
      
      match /followers/{followerId} { allow read: if true; allow write: if isAuthenticated(); }
      match /following/{followedId} { allow read: if true; allow write: if isOwner(userId); }
    }

    match /posts/{postId} {
      allow read: if true; allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (resource.data.userId == request.auth.uid || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likesCount', 'likedBy', 'shares', 'commentsCount']));
      allow delete: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      match /comments/{commentId} { allow read: if true; allow create: if isAuthenticated(); allow delete: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin()); }
    }

    match /churches/{churchId} {
      allow read: if true; allow create: if isAuthenticated(); allow update: if isAuthenticated();
      match /followers/{followerId} { allow read: if true; allow write: if isAuthenticated(); }
    }
    
    match /cells/{cellId} {
      allow read: if true; allow create: if isAuthenticated(); allow update: if isAuthenticated();
      allow delete: if isAuthenticated() && (resource.data.createdBy == request.auth.uid || isAdmin());
    }

    match /prayer_requests/{prayerId} {
      allow read: if true; allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (resource.data.userId == request.auth.uid || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['intercessorsCount', 'intercessors']));
      allow delete: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
    }
  }
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(firestoreRulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-red-500 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-red-600 p-6 text-white flex justify-between items-start flex-shrink-0">
          <div className="flex gap-3">
            <Shield size={24} className="mt-1" />
            <div>
              <h2 className="text-xl font-bold">Atualização de Segurança</h2>
              <p className="opacity-90 text-sm mt-1">Copie e cole estas regras no console do Firebase para corrigir erros de permissão.</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          
          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 text-sm text-orange-800 dark:text-orange-200">
             <AlertTriangle className="shrink-0" size={18} />
             <div>
               <p className="font-bold">Ação Necessária</p>
               <p>Regras atualizadas para incluir Trilhas de Leitura, Orações Guiadas e novas funcionalidades.</p>
             </div>
          </div>

          <div className="relative group">
             <div className="absolute top-2 right-2">
                <button 
                  onClick={copyCode} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                   {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copiado!' : 'Copiar Regras'}
                </button>
             </div>
             <pre className="bg-gray-100 dark:bg-black p-4 rounded-xl text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto border border-gray-200 dark:border-gray-800 leading-relaxed whitespace-pre-wrap">
               {firestoreRulesCode}
             </pre>
          </div>

          <div className="text-center text-sm text-gray-500">
             Vá no Console do Firebase &gt; Firestore &gt; Rules, cole e publique.
          </div>

        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/5 flex justify-end flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTutorial;
