pipeline {
    agent any

    environment {
        IMAGE_NAME = "ongaji-front"
        CONTAINER_NAME = "ongaji-front"
        SLACK_CHANNEL = "#4조-빌드및-pr알림"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'feat/frontend-overall',
                    url: 'https://github.com/sesac-final-proj/front.git',
                    credentialsId: 'mrmushdog777'
            }
        }

        stage('Set Permissions') {
            steps {
                sh 'chmod +x build || true'
                sh 'find . -name "*.sh" -exec chmod +x {} \\;'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .'
                sh 'docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${IMAGE_NAME}:latest'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        -p 3000:3000 \
                        --restart unless-stopped \
                        ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Cleanup Old Images') {
            steps {
                sh '''
                    docker images ${IMAGE_NAME} --format "{{.Tag}}" | grep -v latest | sort -rn | tail -n +4 | xargs -r -I {} docker rmi ${IMAGE_NAME}:{} || true
                '''
            }
        }
    }

    post {
        success {
            echo 'Build & Deploy succeeded!'
            slackSend(
                channel: "${SLACK_CHANNEL}",
                color: 'good',
                message: "✅ *${env.JOB_NAME}* #${env.BUILD_NUMBER} Ongaji FrontEnd 배포 성공\n${env.BUILD_URL}"
            )
        }
        failure {
            echo 'Build failed. Check console output.'
            slackSend(
                channel: "${SLACK_CHANNEL}",
                color: 'danger',
                message: "❌ *${env.JOB_NAME}* #${env.BUILD_NUMBER} Ongaji FrontEnd 배포 실패\n${env.BUILD_URL}console"
            )
        }
    }
}
