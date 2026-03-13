import { useState } from "react"
import api from "@/lib/api"

export function useMaintenance(){

  const [loading,setLoading]=useState(false)

  const getTemplate=async()=>{
    const res=await api.get("/maintenance/template")
    return res.data
  }

  const updateTemplate=async(data:any)=>{
    setLoading(true)
    try{
      const res=await api.put("/maintenance/template",data)
      return res.data
    }finally{
      setLoading(false)
    }
  }

  const updateParkingRules=async(data:any)=>{
    const res=await api.put("/maintenance/parking-rules",data)
    return res.data
  }

  const updatePenaltyRules=async(data:any)=>{
    const res=await api.put("/maintenance/penalty-rules",data)
    return res.data
  }
  const getParkingRules=async()=>{
  const res=await api.get("/maintenance/parking-rules")
  return res.data
  }
  return{
    loading,
    getTemplate,
    updateTemplate,
    updateParkingRules,
    updatePenaltyRules,
    getParkingRules
  }
}