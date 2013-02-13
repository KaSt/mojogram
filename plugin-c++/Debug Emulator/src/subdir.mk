################################################################################
# Automatically-generated file. Do not edit!
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
CPP_SRCS += \
../src/Account.cpp \
../src/ApplicationData.cpp \
../src/BGApp.cpp \
../src/BinTreeNodeReader.cpp \
../src/BinTreeNodeWriter.cpp \
../src/ByteArray.cpp \
../src/ChatState.cpp \
../src/FMessage.cpp \
../src/JpegImageResizer.cpp \
../src/MySocketConnection.cpp \
../src/ProtocolTreeNode.cpp \
../src/SDL_rotozoom.cpp \
../src/TestBGApp.cpp \
../src/WAConnection.cpp \
../src/WALogin.cpp \
../src/WebosBGApp.cpp \
../src/XmppRunner.cpp \
../src/base64.cpp \
../src/cJSON.cpp \
../src/fastevents.cpp \
../src/mojowhatsup_service_plugin.cpp \
../src/utilities.cpp 

OBJS += \
./src/Account.o \
./src/ApplicationData.o \
./src/BGApp.o \
./src/BinTreeNodeReader.o \
./src/BinTreeNodeWriter.o \
./src/ByteArray.o \
./src/ChatState.o \
./src/FMessage.o \
./src/JpegImageResizer.o \
./src/MySocketConnection.o \
./src/ProtocolTreeNode.o \
./src/SDL_rotozoom.o \
./src/TestBGApp.o \
./src/WAConnection.o \
./src/WALogin.o \
./src/WebosBGApp.o \
./src/XmppRunner.o \
./src/base64.o \
./src/cJSON.o \
./src/fastevents.o \
./src/mojowhatsup_service_plugin.o \
./src/utilities.o 

CPP_DEPS += \
./src/Account.d \
./src/ApplicationData.d \
./src/BGApp.d \
./src/BinTreeNodeReader.d \
./src/BinTreeNodeWriter.d \
./src/ByteArray.d \
./src/ChatState.d \
./src/FMessage.d \
./src/JpegImageResizer.d \
./src/MySocketConnection.d \
./src/ProtocolTreeNode.d \
./src/SDL_rotozoom.d \
./src/TestBGApp.d \
./src/WAConnection.d \
./src/WALogin.d \
./src/WebosBGApp.d \
./src/XmppRunner.d \
./src/base64.d \
./src/cJSON.d \
./src/fastevents.d \
./src/mojowhatsup_service_plugin.d \
./src/utilities.d 


# Each subdirectory must supply rules for building sources it contributes
src/%.o: ../src/%.cpp
	@echo 'Building file: $<'
	@echo 'Invoking: GCC C++ Compiler'
	i686-pc-linux-gnu-g++ -D_DEBUG -I"C:\Archivos de programa\HP webOS\PDK\include" -I"C:\Documents and Settings\Antonio\workspacewebos\mojowhatsup\plugin-c++\include" -I"C:\Archivos de programa\HP webOS\PDK\include\SDL" -I"C:\Archivos de programa\HP webOS\PDK\include\openssl" -O0 -c -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@:%.o=%.d)" -o "$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '


