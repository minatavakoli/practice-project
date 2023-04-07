import React from 'react'
import { Box, Text } from '@chakra-ui/layout'

const RegisterForm = () => {
  return (
    <div>
      <Box
      width="600px"
      border="1px solid red"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Box p="2rem" borderRadius="10px" bg="#fff" w="40%" height="440px">
        <Text fontWeight="bold" fontSize="1xl">
          RegisterForm
        </Text>
      </Box>
    </Box>
    </div>
  )
}

export default RegisterForm