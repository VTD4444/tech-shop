pipeline {
    agent any

    environment {
        CI = 'true'
        // Cung cấp dummy database url cho prisma generate khi build (nếu cần)
        DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy'
    }

    tools {
        nodejs 'NodeJS-22' 
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Đang clone mã nguồn từ repository...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    echo 'Đang cài đặt dependencies cho backend...'
                    script {
                        if (isUnix()) {
                            sh 'npm ci || npm install'
                        } else {
                            bat 'npm ci || npm install'
                        }
                    }
                }
            }
        }

        stage('Prisma Generate') {
            steps {
                dir('backend') {
                    echo 'Đang khởi tạo Prisma Client...'
                    script {
                        if (isUnix()) {
                            sh 'npx prisma generate'
                        } else {
                            bat 'npx prisma generate'
                        }
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    echo 'Đang tiến hành build NestJS backend...'
                    script {
                        if (isUnix()) {
                            sh 'npm run build'
                        } else {
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    echo 'Đang chạy unit tests cho backend...'
                    script {
                        if (isUnix()) {
                            sh 'npm test -- --passWithNoTests'
                        } else {
                            bat 'npm test -- --passWithNoTests'
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Hoàn tất quy trình CI cho backend.'
        }
        success {
            echo 'Build backend thành công!'
        }
        failure {
            echo 'Build backend thất bại! Vui lòng kiểm tra lại log.'
        }
    }
}
