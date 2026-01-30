import { Component, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { user_Service } from '../../services/user.Service';
import { SharedModule } from '../../../shared/shared.module';
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    imports: [SharedModule]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private userService = inject(user_Service);

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: {
            size: 10,
            weight: 'bold'
          }
        }
      }
    }
  };

  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;

  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: []
  };

  public pieChartData2: ChartData<'pie'> = {
    labels: [],
    datasets: []
  };

  public barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
    },
    barPercentage: 0.3, // Adjust bar width
    categoryPercentage: 0.8 // Adjust space betwe
  };

  public barChartType: ChartType = 'bar';
  public barChartLegend = true;

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  public barChartData2: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  ngOnInit(): void {
    this.getDashboardData();
  }

  getDashboardData(): void {
    this.userService.Get_Dashboard().subscribe(
      (data) => {
        const allMonths = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        this.barChartData = {
          labels: data[0].map((ele: any) => ele.Course_Name),
          datasets: [{
            data: data[0].map((ele: any) => ele.Enrollment_Count),
            label: 'Total Count',
            backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#7E57C2'],
            hoverBackgroundColor: ['#64B5F6', '#81C784', '#FFB74D', '#EF9A9A', '#9575CD']
          }]
        };

        this.barChartData2 = {
          labels: allMonths,
          datasets: [{
            data: allMonths.map(month => {
              const item = data[1].find((ele: any) => ele.Month === month);
              return item ? item.Student_Count : 0;
            }),
            label: 'Student Count',
            backgroundColor: allMonths.map((_, i) => ['#FFA726', '#EF5350','#42A5F5', '#66BB6A'][i % 4]),
            hoverBackgroundColor: allMonths.map((_, i) => ['#FFB74D', '#EF9A9A','#64B5F6', '#81C784'][i % 4])
          }]
        };

        if (data[2]) {
          this.processLineChartData(data[2], allMonths);
        }
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }

  processLineChartData(data: any[], allMonths: string[]): void {
    const courses = [...new Set(data.map(item => item.Course_Name))];

    const datasets = courses.map((course, index) => {
      const courseData = allMonths.map(month => {
        const item = data.find(d => d.Course_Name === course && d.Month === month);
        return item ? item.Student_Count : 0;
      });

      const colors = [
        '#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#7E57C2',
        '#26A69A', '#D4E157', '#FF7043', '#8D6E63', '#78909C'
      ];

      return {
        data: courseData,
        label: course,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '33', // 20% opacity
        fill: true,
        tension: 0.4
      };
    });

    this.lineChartData = {
      labels: allMonths,
      datasets: datasets
    };
  }
}