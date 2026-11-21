import { createContext, useContext, useEffect, useState } from "react";

const MemberContext = createContext(null);

export function MemberProvider({ children }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMember() {
    try {
      const response = await fetch("/api/member/me");
      const data = await response.json();
      setMember(data.member || null);
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMember();
  }, []);

  async function logout() {
    await fetch("/api/member/logout", {
      method: "POST"
    });
    setMember(null);
  }

  return (
    <MemberContext.Provider
      value={{
        member,
        loading,
        setMember,
        refreshMember,
        logout
      }}
    >
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  return useContext(MemberContext);
}
