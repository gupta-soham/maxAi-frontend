import React from 'react';
import { useAccount } from 'wagmi';
import { CategoryAnalysis } from '../components/analysis/CategoryAnalysis';
import { MarketCapAnalysis } from '../components/analysis/MarketCapAnalysis';
import { RiskAnalysis } from '../components/analysis/RiskAnalysis';
import { ConnectWalletMessage } from '../components/shared/ConnectWalletMessage';
import { useQuery } from '@tanstack/react-query';
import type { PortfolioAnalysis, CategoryResponse } from '../types/analysis';
import { PortfolioMetrics } from '../components/analysis/PortfolioMetrics';

const API_BASE_URL = 'http://localhost:8000/api';

export default function Analysis() {
  const { isConnected, address } = useAccount();

  const { 
    data: analysisData, 
    error: analysisError,
    isLoading: isAnalysisLoading 
  } = useQuery<PortfolioAnalysis>({
    queryKey: ['analysis', address],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/analysis/${address}`);
        if (!response.ok) {
          throw new Error(`Analysis API error: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Analysis API Error:', error);
        throw error;
      }
    },
    enabled: !!address && isConnected,
    retry: 2,
    staleTime: 30000,
  });

  const { 
    data: categoryData, 
    error: categoryError,
    isLoading: isCategoryLoading 
  } = useQuery<CategoryResponse>({
    queryKey: ['categories', address],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categorization/${address}`);
        if (!response.ok) {
          throw new Error(`Category API error: ${response.status}`);
        }
        const data = await response.json();
        console.log('Raw category data:', data); // Debug log
        
        // Ensure we have the correct data structure
        if (!data || !data.categories) {
          return {
            wallet_address: address,
            categories: {
              DeFi: [],
              Stablecoins: [],
              Memecoins: [],
              L1s: [],
              L2s: [],
              Infrastructure: [],
              Gaming: [],
              DAOs: [],
              Metaverse: [],
              GovernanceTokens: [],
              PrivacyCoins: [],
              Others: []
            }
          };
        }
        
        return data;
      } catch (error) {
        console.error('Category API Error:', error);
        throw error;
      }
    },
    enabled: !!address && isConnected,
    retry: 2,
    staleTime: 30000,
  });


  if (!isConnected) {
    return <ConnectWalletMessage />;
  }

  if (!address) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No wallet address available</p>
      </div>
    );
  }

  if (isAnalysisLoading || isCategoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (analysisError || categoryError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
        <p className="text-red-600 dark:text-red-400">
          {analysisError?.message || categoryError?.message || 'Error loading data'}
        </p>
      </div>
    );
  }

  if (!analysisData || !categoryData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available for this wallet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-8">Portfolio Analysis</h1>
      
      <PortfolioMetrics analysis={analysisData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categoryData?.categories && ( // Add null check here
          <CategoryAnalysis categories={categoryData.categories} />
        )}
        <MarketCapAnalysis analysis={analysisData} />
      </div>

      <RiskAnalysis vulnerableAssets={analysisData.vulnerable_assets} />
    </div>
  );
}