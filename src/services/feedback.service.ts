import { api } from './api';

export interface FeedbackItem {
  id: number;
  overallRating: number;
  deliverySpeedRating?: number;
  driverBehaviorRating?: number;
  packageConditionRating?: number;
  comments?: string;
  submittedAt: Date;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  customer: {
    id: number;
    name: string;
    address: string;
  };
  driver?: {
    id: number;
    name: string;
  };
  journey: {
    id: number;
    date: Date;
  };
}

export interface FeedbackStats {
  totalFeedbacks: number;
  averageOverallRating: number;
  averageDeliverySpeedRating: number;
  averageDriverBehaviorRating: number;
  averagePackageConditionRating: number;
  ratingDistribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
  recentFeedbacks: FeedbackItem[];
  topDrivers: {
    driverId: number;
    driverName: string;
    averageRating: number;
    feedbackCount: number;
  }[];
  bottomDrivers: {
    driverId: number;
    driverName: string;
    averageRating: number;
    feedbackCount: number;
  }[];
  trendsOverTime: {
    date: string;
    averageRating: number;
    count: number;
  }[];
}

export interface FeedbackListResponse {
  data: FeedbackItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class FeedbackService {
  async getFeedbacks(params?: {
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
    driverId?: number;
    customerId?: number;
    minRating?: number;
    maxRating?: number;
  }): Promise<FeedbackListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate.toISOString());
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate.toISOString());
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params?.driverId) {
      queryParams.append('driverId', params.driverId.toString());
    }
    if (params?.customerId) {
      queryParams.append('customerId', params.customerId.toString());
    }
    if (params?.minRating) {
      queryParams.append('minRating', params.minRating.toString());
    }
    if (params?.maxRating) {
      queryParams.append('maxRating', params.maxRating.toString());
    }

    const response = await api.get(`/workspace/feedback?${queryParams.toString()}`);
    return response.data;
  }

  async getFeedbackStats(startDate?: Date, endDate?: Date): Promise<FeedbackStats> {
    const queryParams = new URLSearchParams();
    
    if (startDate) {
      queryParams.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      queryParams.append('endDate', endDate.toISOString());
    }

    const response = await api.get(`/workspace/feedback/stats?${queryParams.toString()}`);
    return response.data;
  }

  async getFeedbackById(id: number): Promise<FeedbackItem> {
    const response = await api.get(`/workspace/feedback/${id}`);
    return response.data;
  }

  async exportFeedbacksCSV(params?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate.toISOString());
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate.toISOString());
    }

    const response = await api.get(`/workspace/feedback/export?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const feedbackService = new FeedbackService();