"use client";

import { useEffect, useState } from "react";
import {
  X,
  User,
  MapPin,
  Utensils,
  DollarSign,
  Heart,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type UserPreferences = {
  favorite_cuisines: string[];
  favorite_restaurants: string[];
  taste_profile: {
    [key: string]: number;
  };
  dietary_restrictions: string[];
  price_preference: string;
};

type UserDetails = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  preferences?: UserPreferences;
  taste_profile_summary?: string;
  mutual_friends_count?: number;
};

interface UserDetailPanelProps {
  userId: string | null;
  currentUserId: string | null;
  onClose: () => void;
}

export function UserDetailPanel({
  userId,
  currentUserId,
  onClose,
}: UserDetailPanelProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);

  console.log("🎭 UserDetailPanel render:", { userId, currentUserId, user });

  useEffect(() => {
    if (!userId) {
      console.log("❌ No userId - clearing panel");
      setUser(null);
      return;
    }

    async function fetchUserDetails() {
      console.log("🔍 Fetching user details for:", userId);
      setLoading(true);
      try {
        // Fetch user profile and food preferences
        const url = currentUserId
          ? `/api/friends/profile/${userId}?current_user_id=${currentUserId}`
          : `/api/friends/profile/${userId}`;
        console.log("📡 Fetching from:", url);
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log("✅ User data received:", data);
          setUser(data);
        } else {
          console.error(
            "❌ Failed to fetch user:",
            response.status,
            await response.text(),
          );
        }
      } catch (error) {
        console.error("❌ Failed to fetch user details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserDetails();
  }, [userId, currentUserId]);

  // Simplified return - Panel positioning handles placement
  if (!userId) return null;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-96 h-[700px] rounded-2xl overflow-hidden shadow-2xl"
      style={{
        backdropFilter: "blur(40px) saturate(180%)",
        background: "rgba(248, 250, 252, 0.85)",
        border: "none",
      }}
    >
      {/* Close button */}
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 hover:bg-slate-200/50 rounded-full"
      >
        <X className="w-5 h-5" />
      </Button>

      {loading || !user ? (
        <div className="h-full flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          <p className="text-sm text-slate-500 font-medium">Loading profile...</p>
        </div>
      ) : (
        <div className="h-full overflow-y-auto p-6 space-y-6">
          {/* User header */}
          <div className="flex flex-col items-center text-center space-y-3 pt-8">
            <div className="relative">
              <Image
                src={user.avatar_url || "/default-avatar.png"}
                alt={user.display_name}
                width={100}
                height={100}
                className="rounded-full border-4 border-white shadow-lg"
              />
              {user.mutual_friends_count !== undefined && 
               user.mutual_friends_count !== null && 
               user.mutual_friends_count > 0 && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full glass-panel text-xs font-semibold text-[hsl(var(--primary))]">
                  {user.mutual_friends_count} mutual
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {user.display_name}
              </h2>
              <p className="text-sm text-slate-500">@{user.username}</p>
            </div>
          </div>

          {/* Taste Profile Summary */}
          {user.taste_profile_summary && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4" />
                <h3 className="font-semibold">Taste Profile</h3>
              </div>
              <div 
                className="p-4 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-line"
                style={{
                  backdropFilter: "blur(20px) saturate(150%)",
                  background: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                }}
              >
                {user.taste_profile_summary}
              </div>
            </div>
          )}

          {/* Preferences sections */}
          {user.preferences && (
            <>
              {/* Favorite Cuisines */}
              {user.preferences.favorite_cuisines &&
                user.preferences.favorite_cuisines.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Utensils className="w-4 h-4" />
                      <h3 className="font-semibold">Favorite Cuisines</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.favorite_cuisines.map((cuisine) => (
                        <span
                          key={cuisine}
                          className="px-3 py-1 rounded-full text-xs font-medium glass-btn"
                        >
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Favorite Restaurants */}
              {user.preferences.favorite_restaurants &&
                user.preferences.favorite_restaurants.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Heart className="w-4 h-4 text-red-500" />
                      <h3 className="font-semibold">Favorite Places</h3>
                    </div>
                    <div className="space-y-1">
                      {user.preferences.favorite_restaurants
                        .slice(0, 5)
                        .map((restaurant) => (
                          <div
                            key={restaurant}
                            className="px-3 py-2 rounded-lg glass-btn text-sm"
                          >
                            <MapPin className="w-3 h-3 inline mr-2 text-slate-500" />
                            {restaurant}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Taste Profile */}
              {user.preferences.taste_profile &&
                Object.keys(user.preferences.taste_profile).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <TrendingUp className="w-4 h-4" />
                      <h3 className="font-semibold">Taste Profile</h3>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(user.preferences.taste_profile).map(
                        ([taste, score]) => (
                          <div key={taste}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600 capitalize">
                                {taste}
                              </span>
                              <span className="text-slate-800 font-semibold">
                                {(score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-full transition-all duration-500"
                                style={{ width: `${score * 100}%` }}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Price Preference */}
              {user.preferences.price_preference && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    <DollarSign className="w-4 h-4" />
                    <h3 className="font-semibold">Price Range</h3>
                  </div>
                  <div className="px-3 py-2 rounded-lg glass-btn inline-block">
                    <span className="text-sm font-medium">
                      {user.preferences.price_preference}
                    </span>
                  </div>
                </div>
              )}

              {/* Dietary Restrictions */}
              {user.preferences.dietary_restrictions &&
                user.preferences.dietary_restrictions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Utensils className="w-4 h-4" />
                      <h3 className="font-semibold">Dietary Preferences</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.dietary_restrictions.map(
                        (restriction) => (
                          <span
                            key={restriction}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200"
                          >
                            {restriction}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </>
          )}

          {/* No preferences available */}
          {!user.preferences && !user.taste_profile_summary && (
            <div className="text-center py-8 text-slate-500">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No preference data available</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
